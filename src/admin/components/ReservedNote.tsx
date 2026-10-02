import React from 'react';
import { daysSince, reservedLabel, STALE_RESERVATION_DAYS } from '../utils/inventoryLabels';

/** How long a unit has been reserved, highlighted once it has been held for too long. */
const ReservedNote: React.FC<{ since: string }> = ({ since }) => {
  const days = daysSince(since);
  const stale = days >= STALE_RESERVATION_DAYS;

  return (
    <div
      className={`text-xs mt-1 ${stale ? 'font-semibold text-amber-700' : 'text-gray-500'}`}
      title={
        stale
          ? `Lleva ${STALE_RESERVATION_DAYS} días o más apartada: conviene confirmar la venta o liberarla`
          : undefined
      }
    >
      {stale && <span aria-hidden="true">⚠ </span>}
      {reservedLabel(days)}
    </div>
  );
};

export default ReservedNote;
