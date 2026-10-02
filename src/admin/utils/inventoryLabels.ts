import type { InventoryMovement, UnitStatus } from '../services/adminApi';

export const statusLabels: Record<UnitStatus, string> = {
  DISPONIBLE: 'Disponible',
  APARTADA: 'Apartada',
  VENDIDA: 'Vendida',
};

/** Who made a change. Only imports have no user by design; any other change without one was made by an account since deleted. */
export const movementAuthor = (movement: Pick<InventoryMovement, 'user' | 'action'>) => {
  if (movement.user) return movement.user.name || movement.user.email;
  return movement.action === 'IMPORT' ? 'Importación' : 'Usuario eliminado';
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
