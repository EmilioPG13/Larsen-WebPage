import React, { useEffect, useState } from 'react';
import { adminApi, type InventoryMovement, type InventoryUnit } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-history-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 my-8">
        <h2 id="unit-history-title" className="text-xl font-bold text-gray-900 mb-1">
          Historial
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {unit.brand} {unit.model} · galga {unit.gauge} · serie {unit.serialNumber}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            {error}
          </div>
        )}
        {!movements && !error && <div className="text-gray-600">Cargando historial...</div>}
        {movements && movements.length === 0 && <div className="text-gray-600">Sin movimientos.</div>}

        {movements && movements.length > 0 && (
          <ol className="space-y-3">
            {movements.map((movement) => (
              <li key={movement.id} className="border-l-4 border-larsen-red pl-3">
                <div className="text-sm font-medium text-gray-900">
                  {actionLabels[movement.action]} · {movementAuthor(movement)}
                </div>
                <div className="text-xs text-gray-500">{formatDateTime(movement.createdAt)}</div>
                {describe(movement).map((line) => (
                  <div key={line} className="text-sm text-gray-700">
                    {line}
                  </div>
                ))}
              </li>
            ))}
          </ol>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default UnitHistory;
