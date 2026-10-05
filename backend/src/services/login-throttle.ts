import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

/** Failed logins allowed per client IP inside the window. */
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Throws a 429 when this IP already failed too many times in the window.
 * `retryAfterSeconds` is when the oldest failure in the window expires.
 */
export const assertLoginAllowed = async (ip: string): Promise<void> => {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const recent = await prisma.loginAttempt.findMany({
    where: { ip, createdAt: { gt: since } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  if (recent.length < LOGIN_MAX_FAILURES) return;

  // The block lifts once enough old failures expire to drop below the limit.
  const lifting = recent[recent.length - LOGIN_MAX_FAILURES];
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((lifting.createdAt.getTime() + LOGIN_WINDOW_MS - Date.now()) / 1000)
  );
  throw new AppError('Too many failed login attempts. Try again later.', 429, retryAfterSeconds);
};

/**
 * Records a failed login and drops expired rows so the table stays small.
 * A successful login deliberately does not reset the count: otherwise someone
 * holding one valid account could log in between guesses against another.
 */
export const recordLoginFailure = async (ip: string): Promise<void> => {
  await prisma.loginAttempt.create({ data: { ip } });
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - LOGIN_WINDOW_MS) } },
  });
};
