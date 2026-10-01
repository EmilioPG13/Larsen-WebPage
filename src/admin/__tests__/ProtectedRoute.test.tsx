import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import * as adminApi from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getMe: vi.fn(),
  },
}));

const mockAdminApi = adminApi.adminApi as unknown as Record<string, Mock>;

const storeSession = (role: 'ADMIN' | 'INVENTARIO') => {
  localStorage.setItem('admin_token', 'token');
  localStorage.setItem(
    'admin_user',
    JSON.stringify({ id: 'u1', email: 'u1@example.com', name: 'User', role })
  );
};

const renderRoute = (roles?: ('ADMIN' | 'INVENTARIO')[]) =>
  render(
    <MemoryRouter initialEntries={['/admin/secret']}>
      <Routes>
        <Route path="/admin/login" element={<div>Login page</div>} />
        <Route path="/admin/dashboard" element={<div>Dashboard home</div>} />
        <Route path="/admin/inventario" element={<div>Inventario home</div>} />
        <Route
          path="/admin/secret"
          element={
            <ProtectedRoute roles={roles}>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to login when there is no token, without calling the API', () => {
    renderRoute(['ADMIN']);

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(mockAdminApi.getMe).not.toHaveBeenCalled();
  });

  it('shows nothing protected while the session is being validated', () => {
    storeSession('ADMIN');
    mockAdminApi.getMe.mockImplementation(() => new Promise(() => {}));

    renderRoute(['ADMIN']);

    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
  });

  it('renders the content once /me confirms an allowed role', async () => {
    storeSession('ADMIN');
    mockAdminApi.getMe.mockResolvedValue({ id: 'u1', email: 'u1@example.com', name: 'User', role: 'ADMIN', active: true });

    renderRoute(['ADMIN']);

    expect(await screen.findByText('Secret content')).toBeInTheDocument();
  });

  it('renders the content when no roles are required', async () => {
    storeSession('INVENTARIO');
    mockAdminApi.getMe.mockResolvedValue({ id: 'u1', email: 'u1@example.com', name: 'User', role: 'INVENTARIO', active: true });

    renderRoute();

    expect(await screen.findByText('Secret content')).toBeInTheDocument();
  });

  it('sends an INVENTARIO user away from an ADMIN-only route to the inventory home', async () => {
    storeSession('INVENTARIO');
    mockAdminApi.getMe.mockResolvedValue({ id: 'u1', email: 'u1@example.com', name: 'User', role: 'INVENTARIO', active: true });

    renderRoute(['ADMIN']);

    expect(await screen.findByText('Inventario home')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('sends an ADMIN user away from a route that excludes ADMIN to the dashboard', async () => {
    storeSession('ADMIN');
    mockAdminApi.getMe.mockResolvedValue({ id: 'u1', email: 'u1@example.com', name: 'User', role: 'ADMIN', active: true });

    renderRoute(['INVENTARIO']);

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
  });

  it('trusts the role from /me over a stale stored role', async () => {
    // Stored as ADMIN, but the server says the user was demoted.
    storeSession('ADMIN');
    mockAdminApi.getMe.mockResolvedValue({ id: 'u1', email: 'u1@example.com', name: 'User', role: 'INVENTARIO', active: true });

    renderRoute(['ADMIN']);

    expect(await screen.findByText('Inventario home')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('clears the session and goes to login when /me answers 401', async () => {
    storeSession('ADMIN');
    mockAdminApi.getMe.mockRejectedValue({ response: { status: 401 } });

    renderRoute(['ADMIN']);

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
  });

  it('clears the session and goes to login when /me answers 403', async () => {
    storeSession('ADMIN');
    mockAdminApi.getMe.mockRejectedValue({ response: { status: 403 } });

    renderRoute(['ADMIN']);

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
