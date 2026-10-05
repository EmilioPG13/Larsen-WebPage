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

/** A reservation held this many days is flagged. Keep in sync with the backend report service. */
export const STALE_RESERVATION_DAYS = 15;

const MEXICO_TIME_ZONE = 'America/Mexico_City';
const mexicoDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: MEXICO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The month (`YYYY-MM`) a moment falls in, as Mexico City sees it. */
export const monthOf = (now: Date = new Date()) => mexicoDay.format(now).slice(0, 7);

/** Whole calendar days, counted in Mexico City, from an ISO timestamp until now. */
export const daysSince = (iso: string, now: Date = new Date()) => {
  const dayStart = (date: Date) => Date.parse(`${mexicoDay.format(date)}T00:00:00Z`);
  return Math.max(0, Math.round((dayStart(now) - dayStart(new Date(iso))) / 86_400_000));
};

export const reservedLabel = (days: number) =>
  days === 0 ? 'Apartada hoy' : days === 1 ? 'Apartada hace 1 día' : `Apartada hace ${days} días`;
