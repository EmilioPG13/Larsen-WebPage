import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import * as adminApi from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    logout: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const mockAdminApi = adminApi.adminApi as unknown as Record<string, Mock>;

const storeUser = (role: 'ADMIN' | 'INVENTARIO', name: string | null = 'Ana Pérez') => {
  localStorage.setItem('admin_token', 'token');
  localStorage.setItem(
    'admin_user',
    JSON.stringify({ id: 'u1', email: 'ana@example.com', name, role })
  );
};

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/admin/inventario']}>
      <AdminLayout>
        <div>Page body</div>
      </AdminLayout>
    </MemoryRouter>
  );

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows the full menu plus Usuarios to an ADMIN', () => {
    storeUser('ADMIN');
    renderLayout();

    for (const label of ['Dashboard', 'Inventario', 'Productos', 'Máquinas', 'Marcas', 'Leads', 'Usuarios']) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Usuarios/ })).toHaveAttribute('href', '/admin/usuarios');
  });

  it('shows only Inventario to an INVENTARIO user', () => {
    storeUser('INVENTARIO');
    renderLayout();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Inventario');
    expect(links[0]).toHaveAttribute('href', '/admin/inventario');
    expect(screen.queryByText('Leads')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
  });

  it('shows the signed-in user name, email and role', () => {
    storeUser('INVENTARIO');
    renderLayout();

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    // The role label is also the menu entry text, so match the sidebar footer one.
    expect(screen.getAllByText('Inventario').length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to the email when the user has no name', () => {
    storeUser('ADMIN', null);
    renderLayout();

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('logs out through the API', async () => {
    storeUser('ADMIN');
    renderLayout();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar Sesión' }));

    expect(mockAdminApi.logout).toHaveBeenCalled();
  });

  it('changes the password from the modal', async () => {
    storeUser('ADMIN');
    mockAdminApi.changePassword.mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await user.type(screen.getByLabelText('Contraseña actual'), 'old-password-123');
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'new-password-1234');
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'new-password-1234');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockAdminApi.changePassword).toHaveBeenCalledWith('old-password-123', 'new-password-1234');
    expect(await screen.findByText('Contraseña actualizada correctamente.')).toBeInTheDocument();
  });

  it('does not call the API when the new password is too short', async () => {
    storeUser('ADMIN');
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await user.type(screen.getByLabelText('Contraseña actual'), 'old-password-123');
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'short');
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'short');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockAdminApi.changePassword).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('al menos 12 caracteres');
  });

  it('opens and closes the mobile menu', async () => {
    storeUser('ADMIN');
    const user = userEvent.setup();
    const { container } = renderLayout();
    const sidebar = container.querySelector('div.fixed.w-64') as HTMLElement;

    // Hidden off-canvas until the hamburger is pressed
    expect(sidebar.className).toContain('-translate-x-full');

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(sidebar.className).not.toContain('-translate-x-full');

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(sidebar.className).toContain('-translate-x-full');
  });

  it('closes the mobile menu after choosing a section', async () => {
    storeUser('ADMIN');
    const user = userEvent.setup();
    const { container } = renderLayout();
    const sidebar = container.querySelector('div.fixed.w-64') as HTMLElement;

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('link', { name: /Productos/ }));
    expect(sidebar.className).toContain('-translate-x-full');
  });
});
