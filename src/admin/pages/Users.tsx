import React, { useState, useEffect } from 'react';
import { adminApi, type ManagedUser } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { getStoredUser, type AdminRole } from '../services/session';
import Select from '../components/ui/Select';

const roleLabels: Record<AdminRole, string> = {
  ADMIN: 'Administrador',
  INVENTARIO: 'Inventario',
};

const roleOptions = (['INVENTARIO', 'ADMIN'] as AdminRole[]).map((value) => ({ value, label: roleLabels[value] }));

const emptyForm = { email: '', name: '', role: 'INVENTARIO' as AdminRole, password: '' };

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red';

const Users: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const currentUserId = getStoredUser()?.id;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setUsers(await adminApi.getUsers());
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Error al cargar usuarios'));
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setActionError('');
    setNotice('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      setCreating(true);
      const created = await adminApi.createUser({
        email: form.email,
        name: form.name,
        role: form.role,
        password: form.password,
      });
      setUsers((prev) => [...prev, created]);
      setForm(emptyForm);
      setNotice(`Usuario ${created.email} creado.`);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al crear el usuario'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (user: ManagedUser, data: { role?: AdminRole; active?: boolean }) => {
    clearMessages();
    try {
      const updated = await adminApi.updateUser(user.id, data);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al actualizar el usuario'));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    clearMessages();
    try {
      await adminApi.resetUserPassword(resetTarget.id, resetPassword);
      setNotice(`Contraseña de ${resetTarget.email} restablecida.`);
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al restablecer la contraseña'));
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-600">Cargando usuarios...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-red-600">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Gestión de Usuarios</h1>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          {actionError}
        </div>
      )}
      {notice && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {notice}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Crear usuario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="user-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <Select
              id="user-role"
              value={form.role}
              options={roleOptions}
              onChange={(role) => setForm({ ...form, role: role as AdminRole })}
            />
          </div>
          <div>
            <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña temporal (mínimo 12 caracteres)
            </label>
            <input
              id="user-password"
              type="password"
              required
              minLength={12}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="mt-4 px-6 py-2 bg-larsen-red text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {creating ? 'Creando...' : 'Crear usuario'}
        </button>
      </form>

      {resetTarget && (
        <form onSubmit={handleReset} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Restablecer contraseña de {resetTarget.email}
          </h2>
          <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
            Nueva contraseña (mínimo 12 caracteres)
          </label>
          <input
            id="reset-password"
            type="password"
            required
            minLength={12}
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className={`${inputClass} max-w-md`}
          />
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-larsen-red text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPassword('');
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.name || '—'}
                    {isSelf && <span className="ml-2 text-xs text-gray-500">(tú)</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <Select
                      ariaLabel={`Rol de ${user.email}`}
                      value={user.role}
                      options={roleOptions}
                      disabled={isSelf}
                      compact
                      onChange={(role) => handleUpdate(user, { role: role as AdminRole })}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button
                      onClick={() => handleUpdate(user, { active: !user.active })}
                      disabled={isSelf}
                      className="text-larsen-red hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      {user.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => {
                        clearMessages();
                        setResetTarget(user);
                        setResetPassword('');
                      }}
                      className="text-gray-700 hover:underline"
                    >
                      Restablecer contraseña
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
