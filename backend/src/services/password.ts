import bcrypt from 'bcryptjs';

/**
 * Password hashing, kept free of any other import so the database seed can
 * create the admin account without pulling in the JWT configuration.
 */
const SALT_ROUNDS = 10;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
