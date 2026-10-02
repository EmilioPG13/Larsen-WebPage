import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import env from '../config/env';
import prismaClient from '../config/database';
import { notifyMonthlyReport } from '../services/notify';
import { previousMonth } from '../services/inventory-report';

jest.mock('../config/env', () => ({
  __esModule: true,
  default: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
    CRON_SECRET: 'cron-secret-value',
  },
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() }, inventoryUnit: { findMany: jest.fn() } },
}));

jest.mock('../services/notify', () => ({
  __esModule: true,
  notifyMonthlyReport: jest.fn(),
  notifyNewLead: jest.fn(),
}));

const mockEnv = env as unknown as Record<string, unknown>;
const db = prismaClient as unknown as Record<string, Record<string, jest.Mock>>;
const notify = notifyMonthlyReport as unknown as jest.Mock;

const cronAuth = { Authorization: 'Bearer cron-secret-value' };

describe('GET /api/cron/monthly-report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.CRON_SECRET = 'cron-secret-value';
    db.inventoryUnit.findMany.mockResolvedValue([]);
    notify.mockResolvedValue(true);
  });

  it('stays closed while CRON_SECRET is not set, whatever is sent', async () => {
    mockEnv.CRON_SECRET = undefined;

    await request(app).get('/api/cron/monthly-report').expect(503);
    await request(app).get('/api/cron/monthly-report').set('Authorization', 'Bearer ').expect(503);

    expect(db.inventoryUnit.findMany).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it.each([
    ['no header', undefined],
    ['a wrong secret', 'Bearer nope'],
    ['the right secret without the Bearer scheme', 'cron-secret-value'],
    ['a longer value that starts with the secret', 'Bearer cron-secret-value-and-more'],
  ])('refuses %s with 401 and reads and sends nothing', async (_name, header) => {
    const req = request(app).get('/api/cron/monthly-report');
    if (header) req.set('Authorization', header);

    await req.expect(401);

    expect(db.inventoryUnit.findMany).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not accept a logged-in admin token in place of the secret', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@example.com', role: 'ADMIN', active: true });
    const token = jwt.sign({ userId: 'u1', email: 'a@example.com' }, 'test-secret');

    await request(app).get('/api/cron/monthly-report').set('Authorization', `Bearer ${token}`).expect(401);

    expect(notify).not.toHaveBeenCalled();
  });

  it('emails the closing of the previous month when called with the secret', async () => {
    const res = await request(app).get('/api/cron/monthly-report').set(cronAuth).expect(200);

    const expected = previousMonth();
    expect(res.body).toEqual({ month: expected, sent: true });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toMatchObject({ month: expected });
  });

  it('re-sends a month given by hand', async () => {
    const res = await request(app).get('/api/cron/monthly-report').query({ month: '2026-08' }).set(cronAuth).expect(200);

    expect(res.body.month).toBe('2026-08');
    expect(notify.mock.calls[0][0]).toMatchObject({ month: '2026-08' });
  });

  it('rejects a month that is not YYYY-MM with 400', async () => {
    await request(app).get('/api/cron/monthly-report').query({ month: '2026-13' }).set(cronAuth).expect(400);

    expect(notify).not.toHaveBeenCalled();
  });

  it('says when nothing was sent because email is not configured', async () => {
    notify.mockResolvedValue(false);

    const res = await request(app).get('/api/cron/monthly-report').set(cronAuth).expect(200);

    expect(res.body.sent).toBe(false);
  });

  it('answers 500 when the email fails, so the cron run shows as failed', async () => {
    notify.mockRejectedValue(new Error('SMTP down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await request(app).get('/api/cron/monthly-report').set(cronAuth).expect(500);
  });
});
