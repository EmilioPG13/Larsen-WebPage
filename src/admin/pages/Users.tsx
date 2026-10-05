import React, { useState, useEffect } from 'react';
import { adminApi, type ManagedUser } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { getStoredUser, type AdminRole } from '../services/session';
import Select from '../components/ui/Select';
import DeleteUserModal from '../components/DeleteUserModal';
import { Alert, Notice, PageError, PageHeader, PageLoading, Tag } from '../components/ui/kit';

const roleLabels: Record<AdminRole, string> = {
  ADMIN: 'Administrador',
  INVENTARIO: 'Inventario',
};

const roleOptions = (['INVENTARIO', 'ADMIN'] as AdminRole[]).map((value) => ({ value, label: roleLabels[value] }));

const emptyForm = { email: '', name: '', role: 'INVENTARIO' as AdminRole, password: '' };

const inputClass = 'adm-input';

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
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    try {
      setDeleting(true);
      await adminApi.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      if (resetTarget?.id === deleteTarget.id) setResetTarget(null);
      setNotice(`Usuario ${deleteTarget.email} eliminado.`);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Error al eliminar el usuario'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoading>Cargando usuarios...</PageLoading>;
  if (loadError) return <PageError>{loadError}</PageError>;

  return (
    <div className="adm-page">
      <PageHeader title="Gestión de Usuarios" />

      {actionError && <Alert>{actionError}</Alert>}
      {notice && <Notice>{notice}</Notice>}

      <form onSubmit={handleCreate} className="adm-panel mb-6">
        <div className="adm-panel-head">
          <h2 className="adm-panel-title">Crear usuario</h2>
        </div>
        <div className="adm-panel-body">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="user-email" className="adm-field-label">
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
              <label htmlFor="user-name" className="adm-field-label">
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
              <label htmlFor="user-role" className="adm-field-label">
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
              <label htmlFor="user-password" className="adm-field-label">
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
          <button type="submit" disabled={creating} className="adm-btn adm-btn-primary mt-5">
            {creating ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>

      {resetTarget && (
        <form onSubmit={handleReset} className="adm-panel mb-6">
          <div className="adm-panel-head">
            <h2 className="adm-panel-title">Restablecer contraseña de {resetTarget.email}</h2>
          </div>
          <div className="adm-panel-body">
            <label htmlFor="reset-password" className="adm-field-label">
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
            <div className="mt-5 flex gap-2">
              <button type="submit" className="adm-btn adm-btn-primary">
                Restablecer
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setResetPassword('');
                }}
                className="adm-btn"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="adm-panel overflow-x-auto">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Correo</th>
              <th scope="col">Rol</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id}>
                  <td className="text-a-ink">
                    {user.name || '—'}
                    {isSelf && <span className="ml-2 text-[13px] text-a-muted">(tú)</span>}
                  </td>
                  <td className="text-a-text2">{user.email}</td>
                  <td className="min-w-44">
                    <Select
                      ariaLabel={`Rol de ${user.email}`}
                      value={user.role}
                      options={roleOptions}
                      disabled={isSelf}
                      compact
                      onChange={(role) => handleUpdate(user, { role: role as AdminRole })}
                    />
                  </td>
                  <td>
                    <Tag mark={user.active ? 'dot' : 'ring'} tone={user.active ? 'navy' : 'plain'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Tag>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <button
                        onClick={() => handleUpdate(user, { active: !user.active })}
                        disabled={isSelf}
                        className="adm-link adm-brackets"
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => {
                          clearMessages();
                          setResetTarget(user);
                          setResetPassword('');
                        }}
                        className="adm-link adm-link-muted adm-brackets"
                      >
                        Restablecer contraseña
                      </button>
                      <button
                        onClick={() => {
                          clearMessages();
                          setDeleteError('');
                          setDeleteTarget(user);
                        }}
                        disabled={isSelf}
                        title={isSelf ? 'No puedes eliminar tu propia cuenta' : undefined}
                        className="adm-link adm-link-danger adm-brackets"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          deleting={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Users;
