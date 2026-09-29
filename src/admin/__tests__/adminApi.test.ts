import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import api from '../../services/api';
import { adminApi } from '../services/adminApi';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockApi = api as unknown as Record<string, Mock>;

describe('adminApi session handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('login stores the token and the user', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        token: 'jwt',
        user: { id: 'u1', email: 'a@b.co', name: 'Ana', role: 'INVENTARIO' },
      },
    });

    await adminApi.login('a@b.co', 'password');

    expect(localStorage.getItem('admin_token')).toBe('jwt');
    expect(JSON.parse(localStorage.getItem('admin_user') as string)).toEqual({
      id: 'u1',
      email: 'a@b.co',
      name: 'Ana',
      role: 'INVENTARIO',
    });
  });

  it('logout removes both the token and the user', () => {
    localStorage.setItem('admin_token', 'jwt');
    localStorage.setItem('admin_user', '{}');

    adminApi.logout();

    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
  });

  it('getMe refreshes the stored user', async () => {
    localStorage.setItem('admin_token', 'jwt');
    mockApi.get.mockResolvedValue({
      data: { id: 'u1', email: 'a@b.co', name: null, role: 'ADMIN', active: true },
    });

    await adminApi.getMe();

    expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
    expect(JSON.parse(localStorage.getItem('admin_user') as string).role).toBe('ADMIN');
  });

  it('calls the users and password endpoints', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.put.mockResolvedValue({ data: {} });

    await adminApi.getUsers();
    await adminApi.createUser({ email: 'a@b.co', role: 'ADMIN', password: 'x'.repeat(12) });
    await adminApi.updateUser('u1', { active: false });
    await adminApi.resetUserPassword('u1', 'x'.repeat(12));
    await adminApi.changePassword('old', 'new');

    expect(mockApi.get).toHaveBeenCalledWith('/users');
    expect(mockApi.post).toHaveBeenCalledWith('/users', expect.objectContaining({ email: 'a@b.co' }));
    expect(mockApi.put).toHaveBeenCalledWith('/users/u1', { active: false });
    expect(mockApi.put).toHaveBeenCalledWith('/users/u1/password', { password: 'x'.repeat(12) });
    expect(mockApi.put).toHaveBeenCalledWith('/auth/password', {
      currentPassword: 'old',
      newPassword: 'new',
    });
  });
});
