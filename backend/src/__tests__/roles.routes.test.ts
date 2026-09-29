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

jest.mock('../config/database', () => {
  const model = () => ({
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  });
  return {
    __esModule: true,
    default: {
      user: model(),
      brand: model(),
      product: model(),
      machine: model(),
      lead: model(),
      contactSubmission: model(),
      $transaction: jest.fn(),
    },
  };
});

const prisma = prismaClient as unknown as Record<string, Record<string, jest.Mock>>;

const DATA_MODELS = ['brand', 'product', 'machine', 'lead', 'contactSubmission', 'user'];

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

/**
 * Every route that requires the ADMIN role. Keep in sync with the routers: a
 * new admin route must be added here so its protection is covered.
 */
const ADMIN_ROUTES: [method: 'get' | 'post' | 'put' | 'delete', path: string][] = [
  ['post', '/api/products'],
  ['put', '/api/products/p1'],
  ['delete', '/api/products/p1'],
  ['put', '/api/products/p1/stock'],
  ['post', '/api/machines'],
  ['put', '/api/machines/m1'],
  ['delete', '/api/machines/m1'],
  ['put', '/api/machines/m1/stock'],
  ['post', '/api/brands'],
  ['put', '/api/brands/b1'],
  ['delete', '/api/brands/b1'],
  ['get', '/api/leads'],
  ['get', '/api/leads/stats'],
  ['get', '/api/leads/l1'],
  ['put', '/api/leads/l1/status'],
  ['get', '/api/users'],
  ['post', '/api/users'],
  ['put', '/api/users/u2'],
  ['put', '/api/users/u2/password'],
];

/** Fails if any model method was called, except the user lookup requireRole makes. */
const expectNoDataAccess = () => {
  for (const model of DATA_MODELS) {
    for (const [method, fn] of Object.entries(prisma[model])) {
      if (model === 'user' && method === 'findUnique') continue;
      expect([model, method, fn.mock.calls.length]).toEqual([model, method, 0]);
    }
  }
  expect(prisma.$transaction).not.toHaveBeenCalled();
};

describe('every admin route is closed to non-admins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(ADMIN_ROUTES)('%s %s answers 401 without a token', async (method, path) => {
    await request(app)[method](path).send({}).expect(401);

    expectNoDataAccess();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each(ADMIN_ROUTES)('%s %s answers 403 to an INVENTARIO user', async (method, path) => {
    asUser('INVENTARIO');

    await request(app)[method](path)
      .set('Authorization', `Bearer ${tokenFor('u1')}`)
      .send({})
      .expect(403);

    expectNoDataAccess();
  });

  it.each(ADMIN_ROUTES)('%s %s answers 403 to a deactivated ADMIN', async (method, path) => {
    asUser('ADMIN', false);

    await request(app)[method](path)
      .set('Authorization', `Bearer ${tokenFor('u1')}`)
      .send({})
      .expect(403);

    expectNoDataAccess();
  });
});
