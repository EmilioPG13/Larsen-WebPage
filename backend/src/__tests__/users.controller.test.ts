import { Response, NextFunction } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from '../controllers/users.controller';
import { AuthRequest } from '../middleware/auth.middleware';
import prismaClient from '../config/database';

jest.mock('../config/env', () => ({
  __esModule: true,
  default: { JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: '7d' },
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const prisma = prismaClient as unknown as Record<string, Record<string, jest.Mock>> & {
  $transaction: jest.Mock;
};

// A transaction client distinct from the global one, so tests can tell which
// of the two a query went through.
const tx = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const publicUser = {
  id: 'u2',
  email: 'inv@example.com',
  name: 'Inv',
  role: 'INVENTARIO',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Users Controller', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((work: (client: typeof tx) => unknown) => work(tx));
    req = { body: {}, params: {}, userId: 'u1' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  const call = (fn: typeof getUsers) => fn(req as AuthRequest, res as Response, next as NextFunction);

  describe('getUsers', () => {
    it('selects explicit fields so passwordHash is never requested', async () => {
      prisma.user.findMany.mockResolvedValue([publicUser]);

      await call(getUsers);

      const args = prisma.user.findMany.mock.calls[0][0];
      expect(args.select).toBeDefined();
      expect(args.select).not.toHaveProperty('passwordHash');
      expect(args.select).toMatchObject({ id: true, email: true, name: true, role: true, active: true });
      expect(res.json).toHaveBeenCalledWith([publicUser]);
    });
  });

  describe('createUser', () => {
    const validBody = {
      email: 'inv@example.com',
      name: 'Inv',
      role: 'INVENTARIO',
      password: 'temporary-password-1',
    };

    it('creates a user, hashes the password and returns no passwordHash', async () => {
      req.body = validBody;
      prisma.user.create.mockResolvedValue(publicUser);

      await call(createUser);

      const args = prisma.user.create.mock.calls[0][0];
      expect(args.data.passwordHash).toEqual(expect.any(String));
      expect(args.data.passwordHash).not.toBe(validBody.password);
      expect(args.data).not.toHaveProperty('password');
      expect(args.select).not.toHaveProperty('passwordHash');
      expect(res.status).toHaveBeenCalledWith(201);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('lower-cases and trims the email before storing it', async () => {
      req.body = { ...validBody, email: '  Ana@X.com ' };
      prisma.user.create.mockResolvedValue(publicUser);

      await call(createUser);

      expect(prisma.user.create.mock.calls[0][0].data.email).toBe('ana@x.com');
    });

    it.each([
      ['an invalid role', { role: 'SUPERUSER' }],
      ['a missing role', { role: undefined }],
      ['a short password', { password: 'short' }],
      ['an invalid email', { email: 'not-an-email' }],
    ])('rejects %s with 400', async (_label, override) => {
      req.body = { ...validBody, ...override };

      await call(createUser);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('responds 409 on a duplicate email (P2002)', async () => {
      req.body = validBody;
      prisma.user.create.mockRejectedValue({ code: 'P2002' });

      await call(createUser);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 409 }));
    });
  });

  describe('updateUser', () => {
    it('updates name, role and active for a non-admin user', async () => {
      req.params = { id: 'u2' };
      req.body = { name: 'New', role: 'ADMIN', active: false };
      tx.user.findUnique.mockResolvedValue({ id: 'u2', role: 'INVENTARIO', active: true });
      tx.user.update.mockResolvedValue({ ...publicUser, name: 'New' });

      await call(updateUser);

      expect(tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u2' },
          data: { name: 'New', role: 'ADMIN', active: false },
        })
      );
      const args = tx.user.update.mock.calls[0][0];
      expect(args.select).not.toHaveProperty('passwordHash');
      expect(res.json).toHaveBeenCalled();
    });

    it('responds 404 when the user does not exist', async () => {
      req.params = { id: 'missing' };
      req.body = { name: 'X' };
      tx.user.findUnique.mockResolvedValue(null);

      await call(updateUser);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });

    it('rejects an invalid role with 400', async () => {
      req.params = { id: 'u2' };
      req.body = { role: 'ROOT' };

      await call(updateUser);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    describe('last active ADMIN protection', () => {
      beforeEach(() => {
        req.params = { id: 'u1' };
        tx.user.findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN', active: true });
      });

      it('refuses to demote the last active ADMIN', async () => {
        req.body = { role: 'INVENTARIO' };
        tx.user.count.mockResolvedValue(0);

        await call(updateUser);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 400,
            message: expect.stringContaining('last active administrator'),
          })
        );
        expect(tx.user.update).not.toHaveBeenCalled();
      });

      it('refuses to deactivate the last active ADMIN', async () => {
        req.body = { active: false };
        tx.user.count.mockResolvedValue(0);

        await call(updateUser);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
        expect(tx.user.update).not.toHaveBeenCalled();
      });

      it('counts only other active admins when deciding', async () => {
        req.body = { active: false };
        tx.user.count.mockResolvedValue(0);

        await call(updateUser);

        expect(tx.user.count).toHaveBeenCalledWith({
          where: { role: 'ADMIN', active: true, id: { not: 'u1' } },
        });
      });

      it('lets an admin demote themselves when another active ADMIN remains', async () => {
        req.body = { role: 'INVENTARIO' };
        tx.user.count.mockResolvedValue(1);
        tx.user.update.mockResolvedValue({ ...publicUser, id: 'u1', role: 'INVENTARIO' });

        await call(updateUser);

        expect(tx.user.update).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });

      it('does not run the check for a change that keeps the ADMIN active (rename)', async () => {
        req.body = { name: 'Renamed' };
        tx.user.update.mockResolvedValue({ ...publicUser, id: 'u1', name: 'Renamed' });

        await call(updateUser);

        expect(tx.user.count).not.toHaveBeenCalled();
        expect(tx.user.update).toHaveBeenCalled();
      });

      it('does not block changing an ADMIN that is already inactive', async () => {
        tx.user.findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN', active: false });
        req.body = { role: 'INVENTARIO' };
        tx.user.update.mockResolvedValue({ ...publicUser, id: 'u1' });

        await call(updateUser);

        expect(tx.user.count).not.toHaveBeenCalled();
        expect(tx.user.update).toHaveBeenCalled();
      });
    });
    describe('transaction handling', () => {
      const serializationError = { code: 'P2034' };

      beforeEach(() => {
        req.params = { id: 'u1' };
        req.body = { active: false };
        tx.user.findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN', active: true });
        tx.user.count.mockResolvedValue(1);
        tx.user.update.mockResolvedValue({ ...publicUser, id: 'u1', active: false });
      });

      it('runs the read, the admin count and the update in one serializable transaction', async () => {
        await call(updateUser);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
          isolationLevel: 'Serializable',
        });
        expect(tx.user.findUnique).toHaveBeenCalled();
        expect(tx.user.count).toHaveBeenCalled();
        expect(tx.user.update).toHaveBeenCalled();
        // Nothing went through the global client.
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.user.count).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it('retries when the transaction fails with P2034 and then succeeds', async () => {
        prisma.$transaction
          .mockRejectedValueOnce(serializationError)
          .mockImplementation((work: (client: typeof tx) => unknown) => work(tx));

        await call(updateUser);

        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
      });

      it('gives up with 409 after repeated P2034 failures', async () => {
        prisma.$transaction.mockRejectedValue(serializationError);

        await call(updateUser);

        expect(prisma.$transaction).toHaveBeenCalledTimes(3);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 409 }));
        expect(res.json).not.toHaveBeenCalled();
      });

      it('does not retry other errors', async () => {
        prisma.$transaction.mockRejectedValue(new Error('db down'));

        await call(updateUser);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('resetUserPassword', () => {
    it('hashes the new password and never returns it or a hash', async () => {
      req.params = { id: 'u2' };
      req.body = { password: 'brand-new-password' };
      prisma.user.update.mockResolvedValue({ id: 'u2' });

      await call(resetUserPassword);

      const args = prisma.user.update.mock.calls[0][0];
      expect(args.data.passwordHash).toEqual(expect.any(String));
      expect(args.data.passwordHash).not.toBe('brand-new-password');
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(body)).not.toContain('passwordHash');
      expect(JSON.stringify(body)).not.toContain('brand-new-password');
    });

    it('rejects a password shorter than 12 characters', async () => {
      req.params = { id: 'u2' };
      req.body = { password: 'short' };

      await call(resetUserPassword);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('responds 404 when the user does not exist (P2025)', async () => {
      req.params = { id: 'missing' };
      req.body = { password: 'brand-new-password' };
      prisma.user.update.mockRejectedValue({ code: 'P2025' });

      await call(resetUserPassword);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      req.params = { id: 'u2' };
      tx.user.findUnique.mockResolvedValue({ id: 'u2', role: 'INVENTARIO', active: true });
      tx.user.delete.mockResolvedValue({ id: 'u2' });
    });

    it('deletes the user inside a serializable transaction and confirms', async () => {
      await call(deleteUser);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      });
      expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
      expect(next).not.toHaveBeenCalled();
    });

    it('refuses to delete the caller, without touching the database', async () => {
      req.params = { id: 'u1' };

      await call(deleteUser);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 400, message: 'You cannot delete your own account' })
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.user.delete).not.toHaveBeenCalled();
    });

    it('responds 404 when the user does not exist', async () => {
      tx.user.findUnique.mockResolvedValue(null);

      await call(deleteUser);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
      expect(tx.user.delete).not.toHaveBeenCalled();
    });

    it('responds 404 when the row disappears before the delete (P2025)', async () => {
      tx.user.delete.mockRejectedValue({ code: 'P2025' });

      await call(deleteUser);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });

    it('does not run the last-admin check for a non-admin user', async () => {
      await call(deleteUser);

      expect(tx.user.count).not.toHaveBeenCalled();
    });

    describe('last active ADMIN protection', () => {
      beforeEach(() => {
        tx.user.findUnique.mockResolvedValue({ id: 'u2', role: 'ADMIN', active: true });
      });

      it('refuses to delete the last active ADMIN', async () => {
        tx.user.count.mockResolvedValue(0);

        await call(deleteUser);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 400,
            message: 'Cannot delete the last active administrator',
          })
        );
        expect(tx.user.delete).not.toHaveBeenCalled();
      });

      it('counts only the other active admins', async () => {
        tx.user.count.mockResolvedValue(1);

        await call(deleteUser);

        expect(tx.user.count).toHaveBeenCalledWith({
          where: { role: 'ADMIN', active: true, id: { not: 'u2' } },
        });
        expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
      });

      it('lets an inactive ADMIN be deleted without the check', async () => {
        tx.user.findUnique.mockResolvedValue({ id: 'u2', role: 'ADMIN', active: false });

        await call(deleteUser);

        expect(tx.user.count).not.toHaveBeenCalled();
        expect(tx.user.delete).toHaveBeenCalled();
      });
    });
  });
});
