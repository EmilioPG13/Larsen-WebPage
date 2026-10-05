import { Response, NextFunction } from 'express';
import { Prisma, Role } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { hashPassword } from '../services/password';
import { MIN_PASSWORD_LENGTH, normalizeEmail } from '../services/auth.service';

// Explicit select so passwordHash can never leak into a response.
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const errorCode = (error: unknown): string | undefined => (error as { code?: string }).code;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (Object.values(Role) as string[]).includes(value);

const assertValidPassword = (password: unknown): string => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
  return password;
};

/**
 * Throws 400 when the change would leave the system without an active ADMIN,
 * i.e. the target is an active ADMIN today and no other active ADMIN exists.
 * Takes the transaction client so the count and the update see one snapshot.
 */
const assertNotLastAdmin = async (
  tx: Prisma.TransactionClient,
  targetId: string,
  action = 'deactivate or demote'
) => {
  const otherActiveAdmins = await tx.user.count({
    where: { role: 'ADMIN', active: true, id: { not: targetId } },
  });

  if (otherActiveAdmins === 0) {
    throw new AppError(`Cannot ${action} the last active administrator`, 400);
  }
};

/** Total attempts (first try included) when a serializable transaction conflicts. */
const MAX_SERIALIZATION_ATTEMPTS = 3;

/**
 * Runs `work` in a serializable transaction and retries on serialization
 * failures (P2034), which is what two concurrent "last admin" changes produce.
 */
const runSerializable = async <T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (errorCode(error) !== 'P2034') throw error;
      if (attempt >= MAX_SERIALIZATION_ATTEMPTS) {
        throw new AppError('Concurrent changes conflicted, please try again', 409);
      }
    }
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, name, role, password } = req.body;

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(normalizeEmail(email))) {
      throw new AppError('A valid email is required', 400);
    }
    if (!isRole(role)) {
      throw new AppError(`Role must be one of: ${Object.values(Role).join(', ')}`, 400);
    }
    if (name !== undefined && name !== null && typeof name !== 'string') {
      throw new AppError('Name must be a string', 400);
    }
    const validPassword = assertValidPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizeEmail(email),
        name: typeof name === 'string' && name.trim() ? name.trim() : null,
        role,
        passwordHash: await hashPassword(validPassword),
      },
      select: publicUserSelect,
    });

    res.status(201).json(user);
  } catch (error) {
    if (errorCode(error) === 'P2002') {
      return next(new AppError('A user with this email already exists', 409));
    }
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, role, active } = req.body;
    const data: { name?: string | null; role?: Role; active?: boolean } = {};

    if (name !== undefined) {
      if (name !== null && typeof name !== 'string') {
        throw new AppError('Name must be a string', 400);
      }
      data.name = typeof name === 'string' && name.trim() ? name.trim() : null;
    }
    if (role !== undefined) {
      if (!isRole(role)) {
        throw new AppError(`Role must be one of: ${Object.values(Role).join(', ')}`, 400);
      }
      data.role = role;
    }
    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        throw new AppError('Active must be a boolean', 400);
      }
      data.active = active;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError('Nothing to update', 400);
    }

    const user = await runSerializable(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, active: true },
      });

      if (!target) {
        throw new AppError('User not found', 404);
      }

      // Applies to the caller too: an admin may deactivate or demote themselves
      // as long as another active ADMIN remains.
      const staysActiveAdmin =
        (data.role ?? target.role) === 'ADMIN' && (data.active ?? target.active) === true;
      if (target.role === 'ADMIN' && target.active && !staysActiveAdmin) {
        await assertNotLastAdmin(tx, target.id);
      }

      return tx.user.update({
        where: { id },
        data,
        select: publicUserSelect,
      });
    });

    res.json(user);
  } catch (error) {
    if (errorCode(error) === 'P2025') {
      return next(new AppError('User not found', 404));
    }
    next(error);
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validPassword = assertValidPassword(req.body.password);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(validPassword) },
      select: { id: true },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (errorCode(error) === 'P2025') {
      return next(new AppError('User not found', 404));
    }
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id === req.userId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // The caller is always an active ADMIN, so blocking self-deletion already keeps one around.
    // The check still runs in the transaction to cover two admins deleting each other at once.
    await runSerializable(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, active: true },
      });

      if (!target) {
        throw new AppError('User not found', 404);
      }

      if (target.role === 'ADMIN' && target.active) {
        await assertNotLastAdmin(tx, target.id, 'delete');
      }

      // Inventory movements keep their rows: the relation is ON DELETE SET NULL.
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (errorCode(error) === 'P2025') {
      return next(new AppError('User not found', 404));
    }
    next(error);
  }
};
