import prismaClient from '../config/database';
import { login, getCurrentUser, changePassword } from '../services/auth.service';
import { hashPassword, comparePassword } from '../services/password';

// Keep the real implementation but make calls observable.
jest.mock('../services/password', () => {
  const actual = jest.requireActual('../services/password');
  return { ...actual, comparePassword: jest.fn(actual.comparePassword) };
});

jest.mock('../config/env', () => ({
  __esModule: true,
  default: { JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: '7d' },
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prisma = prismaClient as unknown as Record<string, Record<string, jest.Mock>>;
const mockFindUnique = prisma.user.findUnique;
const mockUpdate = prisma.user.update;

const PASSWORD = 'a-long-enough-password';

describe('auth service', () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword(PASSWORD);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'ADMIN',
    active: true,
    passwordHash,
    ...overrides,
  });

  describe('login', () => {
    it('returns a token and the user with name and role', async () => {
      mockFindUnique.mockResolvedValue(makeUser());

      const result = await login('admin@example.com', PASSWORD);

      expect(result.token).toEqual(expect.any(String));
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'ADMIN',
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects an inactive user with the generic invalid-credentials error', async () => {
      mockFindUnique.mockResolvedValue(makeUser({ active: false }));

      await expect(login('admin@example.com', PASSWORD)).rejects.toMatchObject({
        status: 401,
        message: 'Invalid email or password',
      });
    });

    it('still runs a bcrypt comparison when the user does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(login('nobody@example.com', PASSWORD)).rejects.toMatchObject({ status: 401 });

      expect(comparePassword).toHaveBeenCalledTimes(1);
      const [, hash] = (comparePassword as jest.Mock).mock.calls[0];
      expect(hash).toMatch(/^\$2[aby]\$10\$/);
    });

    it('still runs a bcrypt comparison when the user is inactive', async () => {
      mockFindUnique.mockResolvedValue(makeUser({ active: false }));

      await expect(login('admin@example.com', PASSWORD)).rejects.toMatchObject({ status: 401 });

      expect(comparePassword).toHaveBeenCalledTimes(1);
      // Compared against the dummy hash, not the inactive user's real hash.
      expect((comparePassword as jest.Mock).mock.calls[0][1]).not.toBe(passwordHash);
    });

    it('answers a wrong password and an unknown email identically', async () => {
      mockFindUnique.mockResolvedValueOnce(makeUser());
      const wrongPassword = await login('admin@example.com', 'wrong').catch((e) => e);

      mockFindUnique.mockResolvedValueOnce(null);
      const unknownEmail = await login('nobody@example.com', PASSWORD).catch((e) => e);

      expect(wrongPassword).toMatchObject({ status: 401, message: 'Invalid email or password' });
      expect(unknownEmail).toMatchObject({ status: 401, message: 'Invalid email or password' });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the profile without the password hash', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'ADMIN',
        active: true,
      });

      const user = await getCurrentUser('user-1');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true, name: true, role: true, active: true },
      });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('rejects with 401 when the user is gone or inactive', async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      await expect(getCurrentUser('user-1')).rejects.toMatchObject({ status: 401 });

      mockFindUnique.mockResolvedValueOnce({ id: 'user-1', active: false });
      await expect(getCurrentUser('user-1')).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('changePassword', () => {
    it('hashes and stores the new password when the current one matches', async () => {
      mockFindUnique.mockResolvedValue(makeUser());
      mockUpdate.mockResolvedValue({});

      await changePassword('user-1', PASSWORD, 'another-long-password');
      const call = mockUpdate.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'user-1' });
      expect(call.data.passwordHash).toEqual(expect.any(String));
      expect(call.data.passwordHash).not.toBe('another-long-password');
    });

    it('rejects a wrong current password with 400', async () => {
      mockFindUnique.mockResolvedValue(makeUser());

      await expect(changePassword('user-1', 'wrong', 'another-long-password')).rejects.toMatchObject({
        status: 400,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('rejects a new password shorter than 12 characters', async () => {
      mockFindUnique.mockResolvedValue(makeUser());

      await expect(changePassword('user-1', PASSWORD, 'short')).rejects.toMatchObject({
        status: 400,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
