import React from 'react';
import { daysSince, reservedLabel, STALE_RESERVATION_DAYS } from '../utils/inventoryLabels';
import { Mark } from './ui/kit';

/** How long a unit has been reserved, highlighted once it has been held for too long. */
const ReservedNote: React.FC<{ since: string }> = ({ since }) => {
  const days = daysSince(since);
  const stale = days >= STALE_RESERVATION_DAYS;

  return (
    <div
      className={`mt-1 flex items-center gap-1.5 text-[13px] ${stale ? 'font-semibold text-a-red' : 'text-a-muted'}`}
      title={
        stale
          ? `Lleva ${STALE_RESERVATION_DAYS} días o más apartada: conviene confirmar la venta o liberarla`
          : undefined
      }
    >
      {stale && <Mark name="alert" size={14} />}
      {reservedLabel(days)}
    </div>
  );
};

export default ReservedNote;
