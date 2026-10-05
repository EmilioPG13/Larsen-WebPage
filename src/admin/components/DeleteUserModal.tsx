import React, { useEffect, useRef, useState } from 'react';
import type { ManagedUser } from '../services/adminApi';
import { Alert } from './ui/kit';

/** The phrase that has to be typed before the delete button unlocks. */
export const DELETE_USER_PHRASE = 'eliminar usuario';

interface DeleteUserModalProps {
  user: ManagedUser;
  deleting: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, deleting, error, onConfirm, onCancel }) => {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmed = typed.trim().toLowerCase() === DELETE_USER_PHRASE;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmed && !deleting) onConfirm();
  };

  return (
    <div
      className="adm-scrim items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !deleting) onCancel();
      }}
    >
      <form onSubmit={handleSubmit} className="adm-dialog max-w-md">
        <div className="adm-dialog-head">
          <h2 id="delete-user-title" className="adm-dialog-title">
            Eliminar usuario
          </h2>
        </div>

        <div className="adm-dialog-body">
          <p className="m-0 mb-4 text-a-text2">
            Vas a eliminar a <span className="font-semibold text-a-ink">{user.email}</span>. Perderá el acceso al panel
            de inmediato y esta acción no se puede deshacer. Sus cambios en el inventario se conservan en el historial como
            «Usuario eliminado». Si solo quieres quitarle el acceso por un tiempo, usa «Desactivar».
          </p>

          {error && <Alert>{error}</Alert>}

          <label htmlFor="delete-user-confirm" className="adm-field-label">
            Escribe <span className="adm-num font-semibold text-a-red">{DELETE_USER_PHRASE}</span> para confirmar
          </label>
          <input
            id="delete-user-confirm"
            ref={inputRef}
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="adm-input"
          />
        </div>

        <div className="adm-dialog-foot">
          <button type="submit" disabled={!confirmed || deleting} className="adm-btn adm-btn-danger-solid">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button type="button" onClick={onCancel} disabled={deleting} className="adm-btn">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeleteUserModal;
