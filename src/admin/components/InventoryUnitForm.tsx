import React, { useState } from 'react';
import type { InventoryUnit, UnitModality, UnitStatus } from '../services/adminApi';
import { statusLabels } from '../utils/inventoryLabels';
import Combobox from './ui/Combobox';
import DatePicker from './ui/DatePicker';
import Select from './ui/Select';

const modalityLabels: Record<UnitModality, string> = {
  EN_BODEGA: 'En bodega',
  BAJO_PEDIDO: 'Bajo pedido (en camino)',
};

const modalityOptions = (Object.keys(modalityLabels) as UnitModality[]).map((value) => ({
  value,
  label: modalityLabels[value],
}));

const statusOptions = (Object.keys(statusLabels) as UnitStatus[]).map((value) => ({
  value,
  label: statusLabels[value],
}));

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
            <Combobox
              id="unit-brand"
              required
              value={values.brand}
              options={brands}
              onChange={(brand) => set('brand', brand)}
            />
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
            <Select
              id="unit-modality"
              value={values.modality}
              options={modalityOptions}
              onChange={(modality) => set('modality', modality as UnitModality)}
            />
          </div>
          <div>
            <label htmlFor="unit-received" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de llegada (opcional)
            </label>
            <DatePicker
              id="unit-received"
              value={values.receivedAt}
              onChange={(date) => set('receivedAt', date)}
              allowClear
            />
          </div>
          {!unit && (
            <div>
              <label htmlFor="unit-status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado inicial
              </label>
              <Select
                id="unit-status"
                value={values.status}
                options={statusOptions}
                onChange={(status) => set('status', status as UnitStatus)}
              />
            </div>
          )}
          {showSoldAt && (
            <div>
              <label htmlFor="unit-sold" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de venta
              </label>
              <DatePicker id="unit-sold" value={values.soldAt} onChange={(date) => set('soldAt', date)} allowClear />
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
