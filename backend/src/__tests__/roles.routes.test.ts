import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prismaClient from '../config/database';

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
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    brand: {
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    lead: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const prisma = prismaClient as unknown as Record<string, Record<string, jest.Mock>>;

const tokenFor = (userId: string) =>
  jwt.sign({ userId, email: `${userId}@example.com` }, 'test-secret');

const asUser = (role: 'ADMIN' | 'INVENTARIO', active = true) =>
  prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u1@example.com', role, active });

describe('role enforcement on admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([]);
    prisma.brand.findMany.mockResolvedValue([]);
    prisma.brand.delete.mockResolvedValue({});
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(0);
  });

  it('rejects requests without a token with 401', async () => {
    await request(app).delete('/api/brands/b1').expect(401);
    await request(app).get('/api/leads').expect(401);
    await request(app).get('/api/users').expect(401);
  });

  describe('INVENTARIO user', () => {
    beforeEach(() => asUser('INVENTARIO'));

    it('gets 403 on DELETE /api/brands/:id and the brand is not touched', async () => {
      await request(app)
        .delete('/api/brands/b1')
        .set('Authorization', `Bearer ${tokenFor('u1')}`)
        .expect(403);

      expect(prisma.brand.delete).not.toHaveBeenCalled();
    });

    it('gets 403 on GET /api/leads', async () => {
      await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${tokenFor('u1')}`)
        .expect(403);

      expect(prisma.lead.findMany).not.toHaveBeenCalled();
    });

    it('gets 403 on the users API', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor('u1')}`)
        .expect(403);
    });

    it('can still read the public brand list', async () => {
      await request(app).get('/api/brands').expect(200);
    });
  });

  describe('ADMIN user', () => {
    beforeEach(() => asUser('ADMIN'));

    it('passes the role check on DELETE /api/brands/:id', async () => {
      await request(app)
        .delete('/api/brands/b1')
        .set('Authorization', `Bearer ${tokenFor('u1')}`)
        .expect(200);

      expect(prisma.brand.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });

    it('passes the role check on GET /api/leads', async () => {
      await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${tokenFor('u1')}`)
        .expect(200);
    });

    it('lists users without any passwordHash', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'u1@example.com', name: null, role: 'ADMIN', active: true },
      ]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenFor('u1')}`)
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      expect(prisma.user.findMany.mock.calls[0][0].select).not.toHaveProperty('passwordHash');
    });
  });

  it('gets 403 for a deactivated ADMIN', async () => {
    asUser('ADMIN', false);

    await request(app)
      .delete('/api/brands/b1')
      .set('Authorization', `Bearer ${tokenFor('u1')}`)
      .expect(403);
  });

  it('gets 401 when the token belongs to a deleted user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${tokenFor('u1')}`)
      .expect(401);
  });
});
