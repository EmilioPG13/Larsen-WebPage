import request from 'supertest';
import app from '../app';
import prismaClient from '../config/database';
import { hashPassword } from '../services/password';
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  assertLoginAllowed,
  recordLoginFailure,
} from '../services/login-throttle';

jest.mock('../config/env', () => ({
  __esModule: true,
  default: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  },
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    loginAttempt: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  },
}));

const prisma = prismaClient as unknown as Record<string, Record<string, jest.Mock>>;
const attempts = prisma.loginAttempt;

const failuresAt = (...agesMs: number[]) =>
  agesMs.map(age => ({ createdAt: new Date(Date.now() - age) }));

describe('login throttle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assertLoginAllowed', () => {
    it('allows an IP below the limit', async () => {
      attempts.findMany.mockResolvedValue(failuresAt(1000, 2000, 3000, 4000));

      await expect(assertLoginAllowed('1.2.3.4')).resolves.toBeUndefined();
    });

    it('only counts failures inside the window', async () => {
      attempts.findMany.mockResolvedValue([]);

      await assertLoginAllowed('1.2.3.4');

      const where = attempts.findMany.mock.calls[0][0].where;
      expect(where.ip).toBe('1.2.3.4');
      const since = where.createdAt.gt as Date;
      expect(Date.now() - since.getTime()).toBeGreaterThanOrEqual(LOGIN_WINDOW_MS - 50);
      expect(Date.now() - since.getTime()).toBeLessThan(LOGIN_WINDOW_MS + 5000);
    });

    it('blocks with 429 at the limit and says when it lifts', async () => {
      // Oldest first; the oldest failed 10 minutes ago, so 5 minutes remain.
      const tenMinutes = 10 * 60 * 1000;
      attempts.findMany.mockResolvedValue(
        failuresAt(tenMinutes, 9 * 60 * 1000, 8 * 60 * 1000, 7 * 60 * 1000, 6 * 60 * 1000)
      );

      expect(LOGIN_MAX_FAILURES).toBe(5);
      await expect(assertLoginAllowed('1.2.3.4')).rejects.toMatchObject({
        status: 429,
        retryAfterSeconds: expect.any(Number),
      });
      const error = await assertLoginAllowed('1.2.3.4').catch(e => e);
      expect(error.retryAfterSeconds).toBeGreaterThan(290);
      expect(error.retryAfterSeconds).toBeLessThanOrEqual(300);
    });

    it('lifts when the failure that crosses the limit expires, not the very oldest', async () => {
      // Six failures: dropping the oldest leaves five, still blocked; the
      // second oldest (8 min ago) is the one whose expiry frees the IP.
      attempts.findMany.mockResolvedValue(
        failuresAt(14 * 60 * 1000, 8 * 60 * 1000, 6 * 60 * 1000, 4 * 60 * 1000, 2 * 60 * 1000, 1000)
      );

      const error = await assertLoginAllowed('1.2.3.4').catch(e => e);

      expect(error.retryAfterSeconds).toBeGreaterThan(7 * 60 - 5);
      expect(error.retryAfterSeconds).toBeLessThanOrEqual(7 * 60);
    });
  });

  describe('recordLoginFailure', () => {
    it('stores the failure and prunes expired rows', async () => {
      await recordLoginFailure('1.2.3.4');

      expect(attempts.create).toHaveBeenCalledWith({ data: { ip: '1.2.3.4' } });
      const cutoff = attempts.deleteMany.mock.calls[0][0].where.createdAt.lt as Date;
      expect(Date.now() - cutoff.getTime()).toBeGreaterThanOrEqual(LOGIN_WINDOW_MS - 50);
    });
  });

  describe('POST /api/auth/login', () => {
    const PASSWORD = 'a-long-enough-password';
    let passwordHash: string;

    beforeAll(async () => {
      passwordHash = await hashPassword(PASSWORD);
    });

    const goodUser = () => ({
      id: 'u1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      active: true,
      passwordHash,
    });

    it('records a failure on wrong credentials', async () => {
      attempts.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue(goodUser());

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'wrong-password-here' });

      expect(res.status).toBe(401);
      expect(attempts.create).toHaveBeenCalledTimes(1);
    });

    it('records a failure for an unknown email too', async () => {
      attempts.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD });

      expect(res.status).toBe(401);
      expect(attempts.create).toHaveBeenCalledTimes(1);
    });

    it('does not record a failure on success', async () => {
      attempts.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue(goodUser());

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: PASSWORD });

      expect(res.status).toBe(200);
      expect(attempts.create).not.toHaveBeenCalled();
    });

    it('does not record a failure when the request is malformed', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com' });

      expect(res.status).toBe(400);
      expect(attempts.create).not.toHaveBeenCalled();
    });

    it('answers 429 with Retry-After once blocked, without touching the user table', async () => {
      attempts.findMany.mockResolvedValue(failuresAt(5000, 4000, 3000, 2000, 1000));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: PASSWORD });

      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBe(String(res.body.retryAfterSeconds));
      expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(attempts.create).not.toHaveBeenCalled();
    });

    it('keys the count on the last X-Forwarded-For hop, ignoring a spoofed first one', async () => {
      attempts.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue(null);

      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '6.6.6.6, 9.9.9.9')
        .send({ email: 'nobody@example.com', password: PASSWORD });

      expect(attempts.findMany.mock.calls[0][0].where.ip).toBe('9.9.9.9');
      expect(attempts.create).toHaveBeenCalledWith({ data: { ip: '9.9.9.9' } });
    });
  });
});
