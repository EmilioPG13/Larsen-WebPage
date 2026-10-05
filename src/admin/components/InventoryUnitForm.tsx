import React, { useState } from 'react';
import type { InventoryUnit, UnitModality, UnitStatus } from '../services/adminApi';
import { statusLabels } from '../utils/inventoryLabels';
import Combobox from './ui/Combobox';
import DatePicker from './ui/DatePicker';
import Select from './ui/Select';
import { Alert } from './ui/kit';

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

const inputClass = 'adm-input';

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
      className="adm-scrim items-start"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-form-title"
    >
      <form onSubmit={handleSubmit} className="adm-dialog my-8 max-w-2xl">
        <div className="adm-dialog-head">
          <h2 id="unit-form-title" className="adm-dialog-title">
            {unit ? 'Editar unidad' : 'Nueva unidad'}
          </h2>
        </div>

        <div className="adm-dialog-body">
        {error && <Alert>{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit-brand" className="adm-field-label">
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
            <label htmlFor="unit-model" className="adm-field-label">
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
            <label htmlFor="unit-gauge" className="adm-field-label">
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
            <label htmlFor="unit-serial" className="adm-field-label">
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
            <label htmlFor="unit-modality" className="adm-field-label">
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
            <label htmlFor="unit-received" className="adm-field-label">
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
              <label htmlFor="unit-status" className="adm-field-label">
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
              <label htmlFor="unit-sold" className="adm-field-label">
                Fecha de venta
              </label>
              <DatePicker id="unit-sold" value={values.soldAt} onChange={(date) => set('soldAt', date)} allowClear />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="unit-notes" className="adm-field-label">
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

        </div>

        <div className="adm-dialog-foot">
          <button type="submit" disabled={saving} className="adm-btn adm-btn-primary">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={onCancel} className="adm-btn">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryUnitForm;
