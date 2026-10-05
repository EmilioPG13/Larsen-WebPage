import React, { useEffect, useRef, useState } from 'react';
import type { ManagedUser } from '../services/adminApi';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !deleting) onCancel();
      }}
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 id="delete-user-title" className="text-xl font-bold text-gray-900 mb-2">
          Eliminar usuario
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Vas a eliminar a <span className="font-semibold text-gray-900">{user.email}</span>. Perderá el acceso al panel
          de inmediato y esta acción no se puede deshacer. Sus cambios en el inventario se conservan en el historial como
          «Usuario eliminado». Si solo quieres quitarle el acceso por un tiempo, usa «Desactivar».
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        <label htmlFor="delete-user-confirm" className="block text-sm font-medium text-gray-700 mb-1">
          Escribe <span className="font-mono font-semibold text-larsen-red">{DELETE_USER_PHRASE}</span> para confirmar
        </label>
        <input
          id="delete-user-confirm"
          ref={inputRef}
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red"
        />

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={!confirmed || deleting}
            className="px-6 py-2 bg-larsen-red text-white rounded-lg transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeleteUserModal;
