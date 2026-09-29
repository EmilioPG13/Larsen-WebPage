import jwt from 'jsonwebtoken';
import env from '../config/env';
import prisma from '../config/database';
import { comparePassword, hashPassword } from './password';
import { AppError } from '../middleware/error.middleware';

/** Same minimum as ADMIN_PASSWORD in prisma/seed.ts. */
export const MIN_PASSWORD_LENGTH = 12;

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    // JWT_EXPIRES_IN is validated as a string ('7d'); the types want the
    // narrower literal union that only accepts a duration or a number.
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // An inactive account gets the same answer as a wrong password so the
  // response does not reveal that the account exists.
  if (!user || !user.active) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user.id, user.email);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

/** Returns the current user's profile, or 401 if it is gone or deactivated. */
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user || !user.active) {
    throw new AppError('Session is no longer valid', 401);
  }

  return user;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.active) {
    throw new AppError('Session is no longer valid', 401);
  }

  const isValidPassword = await comparePassword(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
};
