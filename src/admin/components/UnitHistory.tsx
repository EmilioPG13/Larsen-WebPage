import React, { useEffect, useState } from 'react';
import { adminApi, type InventoryMovement, type InventoryUnit } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { Alert } from './ui/kit';
import { formatDateTime, movementAuthor, statusLabels } from '../utils/inventoryLabels';

const fieldLabels: Record<string, string> = {
  brand: 'Marca',
  model: 'Modelo',
  gauge: 'Galga',
  serialNumber: 'No. de serie',
  modality: 'Modalidad',
  notes: 'Observaciones',
  receivedAt: 'Fecha de llegada',
  soldAt: 'Fecha de venta',
  machineId: 'Ficha',
  externalId: 'ID externo',
};

const actionLabels: Record<InventoryMovement['action'], string> = {
  CREATE: 'Alta',
  UPDATE: 'Edición',
  STATUS: 'Cambio de estado',
  IMPORT: 'Importación del Excel',
};

const show = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value));

const describe = (movement: InventoryMovement): string[] => {
  const lines: string[] = [];
  if (movement.fromStatus || movement.toStatus) {
    lines.push(
      `Estado: ${movement.fromStatus ? statusLabels[movement.fromStatus] : '—'} → ${
        movement.toStatus ? statusLabels[movement.toStatus] : '—'
      }`
    );
  }
  Object.entries(movement.changes ?? {}).forEach(([field, [before, after]]) => {
    const isDate = field === 'soldAt' || field === 'receivedAt';
    const format = (value: unknown) => (isDate && typeof value === 'string' ? value.slice(0, 10) : show(value));
    lines.push(`${fieldLabels[field] ?? field}: ${format(before)} → ${format(after)}`);
  });
  return lines;
};

interface UnitHistoryProps {
  unit: InventoryUnit;
  onClose: () => void;
}

const UnitHistory: React.FC<UnitHistoryProps> = ({ unit, onClose }) => {
  const [movements, setMovements] = useState<InventoryMovement[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getInventoryMovements(unit.id)
      .then((data) => {
        if (!cancelled) setMovements(data);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Error al cargar el historial'));
      });
    return () => {
      cancelled = true;
    };
  }, [unit.id]);

  return (
    <div
      className="adm-scrim items-start"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-history-title"
    >
      <div className="adm-dialog my-8 max-w-xl">
        <div className="adm-dialog-head">
          <h2 id="unit-history-title" className="adm-dialog-title">
            Historial
          </h2>
          <p className="adm-note adm-num">
            {unit.brand} {unit.model} · galga {unit.gauge} · serie {unit.serialNumber}
          </p>
        </div>

        <div className="adm-dialog-body">
          {error && <Alert>{error}</Alert>}
          {!movements && !error && <div className="text-a-muted">Cargando historial...</div>}
          {movements && movements.length === 0 && <div className="text-a-muted">Sin movimientos.</div>}

          {movements && movements.length > 0 && (
            <ol className="adm-timeline">
              {movements.map((movement) => (
                <li key={movement.id}>
                  <div className="text-[14px] font-semibold text-a-ink">
                    {actionLabels[movement.action]} · {movementAuthor(movement)}
                  </div>
                  <div className="adm-num text-[13px] text-a-muted">{formatDateTime(movement.createdAt)}</div>
                  {describe(movement).map((line) => (
                    <div key={line} className="text-[14px] text-a-text2">
                      {line}
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="adm-dialog-foot">
          <button onClick={onClose} className="adm-btn adm-btn-block">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitHistory;
