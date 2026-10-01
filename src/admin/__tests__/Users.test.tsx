import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Users from '../pages/Users';
import * as adminApi from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    resetUserPassword: vi.fn(),
  },
}));

const mockAdminApi = adminApi.adminApi as unknown as Record<string, Mock>;

const now = new Date().toISOString();
const baseUsers = [
  { id: 'u1', email: 'admin@example.com', name: 'Ana Admin', role: 'ADMIN', active: true, createdAt: now, updatedAt: now },
  { id: 'u2', email: 'inv@example.com', name: 'Ivo Inventario', role: 'INVENTARIO', active: true, createdAt: now, updatedAt: now },
];

describe('Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      'admin_user',
      JSON.stringify({ id: 'u1', email: 'admin@example.com', name: 'Ana Admin', role: 'ADMIN' })
    );
    mockAdminApi.getUsers.mockResolvedValue(baseUsers);
  });

  it('shows the loading state first', () => {
    mockAdminApi.getUsers.mockImplementation(() => new Promise(() => {}));
    render(<Users />);
    expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
  });

  it('lists users with name, email, role and status', async () => {
    render(<Users />);

    expect(await screen.findByText('inv@example.com')).toBeInTheDocument();
    expect(screen.getByText('Ivo Inventario')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Activo')).toHaveLength(2);
    expect(screen.getByLabelText('Rol de inv@example.com')).toHaveValue('INVENTARIO');
  });

  it('shows an error when the list cannot be loaded', async () => {
    mockAdminApi.getUsers.mockRejectedValue({ response: { data: { error: 'Insufficient permissions' } } });
    render(<Users />);

    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
  });

  it('creates a user through the API and adds it to the table', async () => {
    const created = {
      id: 'u3', email: 'nuevo@example.com', name: 'Nuevo', role: 'INVENTARIO', active: true, createdAt: now, updatedAt: now,
    };
    mockAdminApi.createUser.mockResolvedValue(created);
    const user = userEvent.setup();
    render(<Users />);
    await screen.findByText('inv@example.com');

    await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@example.com');
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo');
    await user.selectOptions(screen.getByLabelText('Rol'), 'INVENTARIO');
    await user.type(screen.getByLabelText(/Contraseña temporal/), 'temporary-pass-12');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(mockAdminApi.createUser).toHaveBeenCalledWith({
      email: 'nuevo@example.com',
      name: 'Nuevo',
      role: 'INVENTARIO',
      password: 'temporary-pass-12',
    });
    expect(await screen.findByText('nuevo@example.com')).toBeInTheDocument();
  });

  it('shows the backend error when creating a user fails', async () => {
    mockAdminApi.createUser.mockRejectedValue({
      response: { data: { error: 'A user with this email already exists' } },
    });
    const user = userEvent.setup();
    render(<Users />);
    await screen.findByText('inv@example.com');

    await user.type(screen.getByLabelText('Correo electrónico'), 'inv@example.com');
    await user.type(screen.getByLabelText(/Contraseña temporal/), 'temporary-pass-12');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A user with this email already exists');
  });

  it('changes a role through the API', async () => {
    mockAdminApi.updateUser.mockResolvedValue({ ...baseUsers[1], role: 'ADMIN' });
    const user = userEvent.setup();
    render(<Users />);
    await screen.findByText('inv@example.com');

    await user.selectOptions(screen.getByLabelText('Rol de inv@example.com'), 'ADMIN');

    expect(mockAdminApi.updateUser).toHaveBeenCalledWith('u2', { role: 'ADMIN' });
    await waitFor(() => expect(screen.getByLabelText('Rol de inv@example.com')).toHaveValue('ADMIN'));
  });

  it('deactivates a user and shows the new status', async () => {
    mockAdminApi.updateUser.mockResolvedValue({ ...baseUsers[1], active: false });
    const user = userEvent.setup();
    render(<Users />);
    await screen.findByText('inv@example.com');

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[1]);

    expect(mockAdminApi.updateUser).toHaveBeenCalledWith('u2', { active: false });
    expect(await screen.findByText('Inactivo')).toBeInTheDocument();
  });

  it('shows the last-admin error from the backend', async () => {
    mockAdminApi.getUsers.mockResolvedValue([
      baseUsers[0],
      { ...baseUsers[1], id: 'u9', email: 'otro@example.com', role: 'ADMIN' },
    ]);
    mockAdminApi.updateUser.mockRejectedValue({
      response: { data: { error: 'Cannot deactivate or demote the last active administrator' } },
    });
    const user = userEvent.setup();
    render(<Users />);
    await screen.findByText('otro@example.com');

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' })[1]);

    expect(await screen.findByRole('alert')).toHaveTextContent('last active administrator');
  });

  it('does not let the signed-in admin change their own role or status', async () => {
    render(<Users />);
    await screen.findByText('inv@example.com');

    expect(screen.getByLabelText('Rol de admin@example.com')).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Desactivar' })[0]).toBeDisabled();
  });

  it('resets a password through the API', async () => {
    mockAdminApi.resetUserPassword.mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    render(<Users />);
    await screen.findByText('inv@example.com');

    await user.click(screen.getAllByRole('button', { name: 'Restablecer contraseña' })[1]);
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'reset-password-12');
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));

    expect(mockAdminApi.resetUserPassword).toHaveBeenCalledWith('u2', 'reset-password-12');
    expect(await screen.findByText(/restablecida/)).toBeInTheDocument();
  });
});
