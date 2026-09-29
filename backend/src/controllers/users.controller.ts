import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { hashPassword } from '../services/password';
import { MIN_PASSWORD_LENGTH } from '../services/auth.service';

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
 */
const assertNotLastAdmin = async (targetId: string) => {
  const otherActiveAdmins = await prisma.user.count({
    where: { role: 'ADMIN', active: true, id: { not: targetId } },
  });

  if (otherActiveAdmins === 0) {
    throw new AppError(
      'Cannot deactivate or demote the last active administrator',
      400
    );
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

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
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
        email: email.trim(),
        name: typeof name === 'string' && name.trim() ? name.trim() : null,
        role,
        passwordHash: await hashPassword(validPassword),
      },
      select: publicUserSelect,
    });

    res.status(201).json(user);
  } catch (error) {
    if ((error as any).code === 'P2002') {
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

    const target = await prisma.user.findUnique({
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
      await assertNotLastAdmin(target.id);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });

    res.json(user);
  } catch (error) {
    if ((error as any).code === 'P2025') {
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
    if ((error as any).code === 'P2025') {
      return next(new AppError('User not found', 404));
    }
    next(error);
  }
};
