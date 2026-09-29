import { Response, NextFunction } from 'express';
import { requireRole, AuthRequest } from '../middleware/auth.middleware';

jest.mock('../config/env', () => ({
  __esModule: true,
  default: { JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: '7d' },
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const prisma = require('../config/database').default;
const mockFindUnique = prisma.user.findUnique;

describe('requireRole middleware', () => {
  let req: AuthRequest;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { userId: 'user-1' } as AuthRequest;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  const run = (...roles: Parameters<typeof requireRole>) =>
    requireRole(...roles)(req, res as Response, next as NextFunction);

  it('loads the user by id from the database on every request', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co', role: 'ADMIN', active: true });

    await run('ADMIN');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, email: true, role: true, active: true },
    });
  });

  it('responds 401 when the user no longer exists', async () => {
    mockFindUnique.mockResolvedValue(null);

    await run('ADMIN');

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when the user is inactive, even with the right role', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co', role: 'ADMIN', active: false });

    await run('ADMIN');

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 403 when the role is not allowed', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co', role: 'INVENTARIO', active: true });

    await run('ADMIN');

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.userRole for an allowed role', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co', role: 'ADMIN', active: true });

    await run('ADMIN');

    expect(next).toHaveBeenCalledWith();
    expect(req.userRole).toBe('ADMIN');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('accepts any of several allowed roles', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co', role: 'INVENTARIO', active: true });

    await run('ADMIN', 'INVENTARIO');

    expect(next).toHaveBeenCalledWith();
    expect(req.userRole).toBe('INVENTARIO');
  });

  it('forwards database errors to next', async () => {
    const dbError = new Error('db down');
    mockFindUnique.mockRejectedValue(dbError);

    await run('ADMIN');

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
