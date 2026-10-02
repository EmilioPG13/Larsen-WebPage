import React, { useState } from 'react';
import type { InventoryUnit, UnitModality, UnitStatus } from '../services/adminApi';
import { statusLabels } from '../utils/inventoryLabels';

const modalityLabels: Record<UnitModality, string> = {
  EN_BODEGA: 'En bodega',
  BAJO_PEDIDO: 'Bajo pedido (en camino)',
};

/** Fields the form submits. Dates are plain `YYYY-MM-DD` strings. */
export interface UnitFormValues {
  brand: string;
  model: string;
  gauge: string;
  serialNumber: string;
  modality: UnitModality;
  receivedAt: string;
  soldAt: string;
  notes: string;
  /** Only used when creating: a unit can be loaded already reserved or sold. */
  status: UnitStatus;
}

interface InventoryUnitFormProps {
  /** Present when editing; absent when creating. */
  unit?: InventoryUnit;
  brands: string[];
  saving: boolean;
  error: string;
  onSave: (values: UnitFormValues) => void;
  onCancel: () => void;
}

const dateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red';

const InventoryUnitForm: React.FC<InventoryUnitFormProps> = ({ unit, brands, saving, error, onSave, onCancel }) => {
  const [values, setValues] = useState<UnitFormValues>({
    brand: unit?.brand ?? brands[0] ?? '',
    model: unit?.model ?? '',
    gauge: unit?.gauge ?? '',
    serialNumber: unit?.serialNumber ?? '',
    modality: unit?.modality ?? 'EN_BODEGA',
    receivedAt: dateInput(unit?.receivedAt),
    soldAt: dateInput(unit?.soldAt),
    notes: unit?.notes ?? '',
    status: unit?.status ?? 'DISPONIBLE',
  });

  const set = <K extends keyof UnitFormValues>(key: K, value: UnitFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const showSoldAt = unit ? unit.status === 'VENDIDA' : values.status === 'VENDIDA';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-form-title"
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8">
        <h2 id="unit-form-title" className="text-xl font-bold text-gray-900 mb-4">
          {unit ? 'Editar unidad' : 'Nueva unidad'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit-brand" className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              id="unit-brand"
              list="unit-brand-options"
              required
              value={values.brand}
              onChange={(e) => set('brand', e.target.value)}
              className={inputClass}
            />
            <datalist id="unit-brand-options">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="unit-model" className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              id="unit-model"
              required
              value={values.model}
              onChange={(e) => set('model', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="unit-gauge" className="block text-sm font-medium text-gray-700 mb-1">
              Galga
            </label>
            <input
              id="unit-gauge"
              required
              placeholder="7 o 5/7"
              value={values.gauge}
              onChange={(e) => set('gauge', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="unit-serial" className="block text-sm font-medium text-gray-700 mb-1">
              No. de serie
            </label>
            <input
              id="unit-serial"
              required
              value={values.serialNumber}
              onChange={(e) => set('serialNumber', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="unit-modality" className="block text-sm font-medium text-gray-700 mb-1">
              Modalidad
            </label>
            <select
              id="unit-modality"
              value={values.modality}
              onChange={(e) => set('modality', e.target.value as UnitModality)}
              className={inputClass}
            >
              {(Object.keys(modalityLabels) as UnitModality[]).map((modality) => (
                <option key={modality} value={modality}>
                  {modalityLabels[modality]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="unit-received" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de llegada (opcional)
            </label>
            <input
              id="unit-received"
              type="date"
              value={values.receivedAt}
              onChange={(e) => set('receivedAt', e.target.value)}
              className={inputClass}
            />
          </div>
          {!unit && (
            <div>
              <label htmlFor="unit-status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado inicial
              </label>
              <select
                id="unit-status"
                value={values.status}
                onChange={(e) => set('status', e.target.value as UnitStatus)}
                className={inputClass}
              >
                {(Object.keys(statusLabels) as UnitStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showSoldAt && (
            <div>
              <label htmlFor="unit-sold" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de venta
              </label>
              <input
                id="unit-sold"
                type="date"
                value={values.soldAt}
                onChange={(e) => set('soldAt', e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="unit-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (internas, no se muestran en el sitio)
          </label>
          <textarea
            id="unit-notes"
            rows={2}
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-larsen-red text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryUnitForm;
