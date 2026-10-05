import React, { useState } from 'react';
import { adminApi } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { Alert, Notice } from './ui/kit';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 12) {
      setError('La nueva contraseña debe tener al menos 12 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setSaving(true);
      await adminApi.changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al cambiar la contraseña'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="adm-scrim items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="adm-dialog max-w-md">
        <div className="adm-dialog-head">
          <h2 id="change-password-title" className="adm-dialog-title">
            Cambiar contraseña
          </h2>
        </div>

        {done ? (
          <>
            <div className="adm-dialog-body">
              <Notice>Contraseña actualizada correctamente.</Notice>
            </div>
            <div className="adm-dialog-foot">
              <button onClick={onClose} className="adm-btn adm-btn-block">
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="adm-dialog-body space-y-4">
              {error && <Alert className="mb-0">{error}</Alert>}
              <div>
                <label htmlFor="current-password" className="adm-field-label">
                  Contraseña actual
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="adm-input"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="adm-field-label">
                  Nueva contraseña (mínimo 12 caracteres)
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="adm-input"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="adm-field-label">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="adm-input"
                />
              </div>
            </div>
            <div className="adm-dialog-foot justify-end">
              <button type="button" onClick={onClose} className="adm-btn">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="adm-btn adm-btn-primary">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
