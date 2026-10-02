import type { InventoryMovement, UnitStatus } from '../services/adminApi';

export const statusLabels: Record<UnitStatus, string> = {
  DISPONIBLE: 'Disponible',
  APARTADA: 'Apartada',
  VENDIDA: 'Vendida',
};

/** Who made a change; the import script has no user. */
export const movementAuthor = (movement: Pick<InventoryMovement, 'user'>) =>
  movement.user ? movement.user.name || movement.user.email : 'Importación';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
