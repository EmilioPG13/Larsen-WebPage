import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes } from 'react-router-dom';
import { adminRoutes } from '../adminRoutes';
import * as adminApi from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: { getMe: vi.fn(), getStats: vi.fn(), logout: vi.fn(), changePassword: vi.fn() },
}));

// The pages are not under test here: each is a marker, so only the shell is exercised.
vi.mock('../pages/Login', () => ({ default: () => <div>Login page</div> }));
vi.mock('../pages/Dashboard', () => ({ default: () => <div>Dashboard page</div> }));
vi.mock('../pages/Products', () => ({ default: () => <div>Products page</div> }));
vi.mock('../pages/Machines', () => ({ default: () => <div>Machines page</div> }));
vi.mock('../pages/Brands', () => ({ default: () => <div>Brands page</div> }));
vi.mock('../pages/Leads', () => ({ default: () => <div>Leads page</div> }));
vi.mock('../pages/Users', () => ({ default: () => <div>Users page</div> }));
vi.mock('../pages/Reports', () => ({ default: () => <div>Reports page</div> }));
vi.mock('../pages/Inventory', () => ({ default: () => <div>Inventory page</div> }));

const api = adminApi.adminApi as unknown as Record<string, Mock>;

const signIn = (role: 'ADMIN' | 'INVENTARIO') => {
  localStorage.setItem('admin_token', 'token');
  localStorage.setItem('admin_user', JSON.stringify({ id: 'u1', email: 'u1@example.com', name: 'Ana', role }));
  api.getMe.mockResolvedValue({ id: 'u1', email: 'u1@example.com', name: 'Ana', role });
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>{adminRoutes}</Routes>
    </MemoryRouter>,
  );

describe('admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.getStats.mockResolvedValue({ leads: { new: 2 } });
  });

  it('sends a visitor without a session to the login', () => {
    renderAt('/admin/leads');

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(api.getMe).not.toHaveBeenCalled();
  });

  it('keeps the layout mounted and validates the session once while moving between pages', async () => {
    signIn('ADMIN');
    const user = userEvent.setup();
    renderAt('/admin/dashboard');

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    const menu = screen.getByRole('navigation', { name: 'Secciones del panel' });

    await user.click(screen.getByRole('link', { name: /Leads/ }));
    expect(await screen.findByText('Leads page')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Reportes/ }));
    expect(await screen.findByText('Reports page')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Inventario/ }));
    expect(await screen.findByText('Inventory page')).toBeInTheDocument();

    expect(screen.queryByText('Verificando sesión...')).not.toBeInTheDocument();
    // Same DOM node: the menu was never torn down and rebuilt.
    expect(screen.getByRole('navigation', { name: 'Secciones del panel' })).toBe(menu);
    expect(api.getMe).toHaveBeenCalledTimes(1);
    // The new-leads counter still refreshes on each page change: once on load, once per move.
    expect(api.getStats).toHaveBeenCalledTimes(4);
  });

  it('lets the logo go back to the dashboard from another page', async () => {
    signIn('ADMIN');
    const user = userEvent.setup();
    renderAt('/admin/leads');

    expect(await screen.findByText('Leads page')).toBeInTheDocument();
    await user.click(screen.getAllByRole('link', { name: 'Ir al inicio del panel' })[0]);

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  it('sends an INVENTARIO user away from admin-only pages to Inventario', async () => {
    signIn('INVENTARIO');
    renderAt('/admin/leads');

    expect(await screen.findByText('Inventory page')).toBeInTheDocument();
    expect(screen.queryByText('Leads page')).not.toBeInTheDocument();
    await waitFor(() => expect(api.getMe).toHaveBeenCalledTimes(1));
  });

  it('redirects to the login when the server says the session is gone', async () => {
    signIn('ADMIN');
    api.getMe.mockRejectedValue({ response: { status: 401 } });
    renderAt('/admin/dashboard');

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
