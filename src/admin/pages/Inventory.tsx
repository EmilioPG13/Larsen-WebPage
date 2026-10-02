import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, type InventoryUnit, type UnitStatus } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { getStoredUser } from '../services/session';
import InventoryUnitForm, { type UnitFormValues } from '../components/InventoryUnitForm';
import UnitHistory from '../components/UnitHistory';
import ReservedNote from '../components/ReservedNote';
import DatePicker from '../components/ui/DatePicker';
import Select from '../components/ui/Select';
import { formatDateTime, movementAuthor, statusLabels } from '../utils/inventoryLabels';
import ExportMenu, { type ExportFormat } from '../components/ExportMenu';
import { exportInventoryXlsx } from '../utils/inventoryExport';
import { exportInventoryPdf } from '../utils/inventoryPdf';

const STATUSES: UnitStatus[] = ['DISPONIBLE', 'APARTADA', 'VENDIDA'];

const statusStyles: Record<UnitStatus, { badge: string; active: string }> = {
  DISPONIBLE: { badge: 'bg-green-100 text-green-800', active: 'bg-green-600 text-white' },
  APARTADA: { badge: 'bg-yellow-100 text-yellow-800', active: 'bg-yellow-500 text-white' },
  VENDIDA: { badge: 'bg-gray-200 text-gray-700', active: 'bg-gray-600 text-white' },
};

const GRID = 'md:grid md:grid-cols-[1.3fr_0.4fr_0.8fr_2.6fr_1.1fr_1fr] md:items-center md:gap-4';

/** Today in the browser's time zone as `YYYY-MM-DD`, for the sale date input. */
const todayLocal = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Date-only values are stored at UTC midnight, so they are shown in UTC to avoid the previous day. */
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium', timeZone: 'UTC' });

const BRAND_ORDER = ['Steiger', 'Shima Seiki'];
const sortUnits = (units: InventoryUnit[]) =>
  [...units].sort((a, b) => {
    const rank = (brand: string) => {
      const index = BRAND_ORDER.indexOf(brand);
      return index === -1 ? BRAND_ORDER.length : index;
    };
    return (
      rank(a.brand) - rank(b.brand) ||
      a.brand.localeCompare(b.brand) ||
      parseFloat(a.gauge) - parseFloat(b.gauge) ||
      a.model.localeCompare(b.model) ||
      a.serialNumber.localeCompare(b.serialNumber, undefined, { numeric: true })
    );
  });

const Inventory: React.FC = () => {
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [statusFilter, setStatusFilter] = useState<UnitStatus | ''>('');
  const [brandFilter, setBrandFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formUnit, setFormUnit] = useState<InventoryUnit | 'new' | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyUnit, setHistoryUnit] = useState<InventoryUnit | null>(null);
  const [saleTarget, setSaleTarget] = useState<InventoryUnit | null>(null);
  const [saleDate, setSaleDate] = useState(todayLocal());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const isAdmin = getStoredUser()?.role === 'ADMIN';

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      setUnits(await adminApi.getInventory());
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Error al cargar el inventario'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // A write returns the unit without its last movement, so keep the old one
  // until the refetch below brings the new one.
  const replaceUnit = (updated: InventoryUnit) =>
    setUnits((prev) =>
      prev.map((unit) => (unit.id === updated.id ? { ...updated, movements: unit.movements } : unit))
    );

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s, units.filter((u) => u.status === s).length])) as Record<UnitStatus, number>,
    [units]
  );
  const brands = useMemo(() => Array.from(new Set(units.map((u) => u.brand))).sort(), [units]);
  const brandOptions = useMemo(
    () => [{ value: '', label: 'Todas las marcas' }, ...brands.map((brand) => ({ value: brand, label: brand }))],
    [brands],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortUnits(units).filter(
      (unit) =>
        (!statusFilter || unit.status === statusFilter) &&
        (!brandFilter || unit.brand === brandFilter) &&
        (!term || unit.serialNumber.toLowerCase().includes(term) || unit.model.toLowerCase().includes(term))
    );
  }, [units, statusFilter, brandFilter, search]);

  const changeStatus = async (unit: InventoryUnit, status: UnitStatus, soldAt?: string) => {
    setActionError('');
    setBusyId(unit.id);
    try {
      replaceUnit(await adminApi.setInventoryStatus(unit.id, status, soldAt));
      await fetchUnits();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al cambiar el estado'));
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusClick = (unit: InventoryUnit, status: UnitStatus) => {
    if (unit.status === status) return;
    if (status === 'VENDIDA') {
      setSaleDate(todayLocal());
      setSaleTarget(unit);
      return;
    }
    changeStatus(unit, status);
  };

  const confirmSale = async () => {
    if (!saleTarget) return;
    const target = saleTarget;
    setSaleTarget(null);
    await changeStatus(target, 'VENDIDA', saleDate || undefined);
  };

  const handleSave = async (values: UnitFormValues) => {
    setFormError('');
    setSaving(true);
    try {
      if (formUnit && formUnit !== 'new') {
        await adminApi.updateInventoryUnit(formUnit.id, {
          brand: values.brand,
          model: values.model,
          gauge: values.gauge,
          serialNumber: values.serialNumber,
          modality: values.modality,
          receivedAt: values.receivedAt || null,
          notes: values.notes.trim() || null,
          ...(formUnit.status === 'VENDIDA' && values.soldAt ? { soldAt: values.soldAt } : {}),
        });
      } else {
        await adminApi.createInventoryUnit({
          brand: values.brand,
          model: values.model,
          gauge: values.gauge,
          serialNumber: values.serialNumber,
          modality: values.modality,
          status: values.status,
          ...(values.receivedAt ? { receivedAt: values.receivedAt } : {}),
          ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
          ...(values.status === 'VENDIDA' && values.soldAt ? { soldAt: values.soldAt } : {}),
        });
      }
      setFormUnit(null);
      await fetchUnits();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Error al guardar la unidad'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit: InventoryUnit) => {
    if (
      !window.confirm(
        `¿Eliminar la unidad ${unit.brand} ${unit.model} (serie ${unit.serialNumber})? También se borra su historial. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setActionError('');
    try {
      await adminApi.deleteInventoryUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al eliminar la unidad'));
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setActionError('');
    setExporting(true);
    try {
      await (format === 'pdf' ? exportInventoryPdf(units) : exportInventoryXlsx(units));
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al exportar el inventario'));
    } finally {
      setExporting(false);
    }
  };

  if (loading && units.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-600">Cargando inventario...</div>
      </div>
    );
  }

  if (loadError && units.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-red-600">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventario</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setFormError('');
              setFormUnit('new');
            }}
            className="px-4 py-2 bg-larsen-red text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Nueva unidad
          </button>
          <ExportMenu busy={exporting} disabled={units.length === 0} onExport={handleExport} />
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar por estado">
        <button
          onClick={() => setStatusFilter('')}
          aria-pressed={statusFilter === ''}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            statusFilter === '' ? 'bg-larsen-red text-white' : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Todas ({units.length})
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              statusFilter === status ? 'bg-larsen-red text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {statusLabels[status]}s ({counts[status]})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-2xl">
        <div>
          <label htmlFor="inventory-search" className="sr-only">
            Buscar por número de serie o modelo
          </label>
          <input
            id="inventory-search"
            type="search"
            placeholder="Buscar por serie o modelo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red"
          />
        </div>
        <div>
          <label htmlFor="inventory-brand" className="sr-only">
            Filtrar por marca
          </label>
          <Select
            id="inventory-brand"
            value={brandFilter}
            options={brandOptions}
            onChange={setBrandFilter}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div
          className={`hidden px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider ${GRID}`}
          aria-hidden="true"
        >
          <span>Marca y modelo</span>
          <span>Galga</span>
          <span>No. serie</span>
          <span>Estado</span>
          <span>Último cambio</span>
          <span>Acciones</span>
        </div>

        {visible.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {units.length === 0 ? 'Todavía no hay unidades en el inventario.' : 'Ninguna unidad coincide con los filtros.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {visible.map((unit) => {
              const last = unit.movements?.[0];
              const busy = busyId === unit.id;
              return (
                <li key={unit.id} className={`p-4 md:px-6 space-y-3 md:space-y-0 ${GRID}`} data-testid="unit-row">
                  <div>
                    <div className="font-medium text-gray-900">
                      {unit.brand} {unit.model}
                    </div>
                    {unit.modality === 'BAJO_PEDIDO' && <div className="text-xs text-blue-700">Bajo pedido</div>}
                    {unit.notes && <div className="text-xs text-gray-500">{unit.notes}</div>}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="md:hidden text-gray-500">Galga </span>
                    {unit.gauge}
                  </div>
                  <div className="text-sm text-gray-700 break-all">
                    <span className="md:hidden text-gray-500">Serie </span>
                    {unit.serialNumber}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Estado de la unidad ${unit.serialNumber}`}>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusClick(unit, status)}
                          disabled={busy}
                          aria-pressed={unit.status === status}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60 ${
                            unit.status === status
                              ? statusStyles[status].active
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                    {unit.status === 'VENDIDA' && unit.soldAt && (
                      <div className="text-xs text-gray-500 mt-1">Vendida el {formatDate(unit.soldAt)}</div>
                    )}
                    {unit.status === 'APARTADA' && unit.reservedSince && <ReservedNote since={unit.reservedSince} />}
                  </div>
                  <div className="text-xs text-gray-500">
                    {last ? (
                      <>
                        <div className="text-gray-700">{movementAuthor(last)}</div>
                        <div>{formatDateTime(last.createdAt)}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    <button
                      onClick={() => {
                        setFormError('');
                        setFormUnit(unit);
                      }}
                      aria-label={`Editar ${unit.model} serie ${unit.serialNumber}`}
                      className="text-larsen-blue hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setHistoryUnit(unit)}
                      aria-label={`Historial de ${unit.model} serie ${unit.serialNumber}`}
                      className="text-gray-700 hover:underline"
                    >
                      Historial
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(unit)}
                        aria-label={`Eliminar ${unit.model} serie ${unit.serialNumber}`}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formUnit && (
        <InventoryUnitForm
          unit={formUnit === 'new' ? undefined : formUnit}
          brands={brands.length > 0 ? brands : BRAND_ORDER}
          saving={saving}
          error={formError}
          onSave={handleSave}
          onCancel={() => setFormUnit(null)}
        />
      )}

      {historyUnit && <UnitHistory unit={historyUnit} onClose={() => setHistoryUnit(null)} />}

      {saleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sale-title"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 id="sale-title" className="text-xl font-bold text-gray-900 mb-2">
              Marcar como vendida
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {saleTarget.brand} {saleTarget.model} · serie {saleTarget.serialNumber}. Dejará de aparecer en el catálogo del sitio.
            </p>
            <label htmlFor="sale-date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de venta
            </label>
            <DatePicker id="sale-date" value={saleDate} onChange={setSaleDate} />
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmSale}
                className="px-6 py-2 bg-larsen-red text-white rounded-lg hover:opacity-90 transition-colors"
              >
                Confirmar venta
              </button>
              <button
                onClick={() => setSaleTarget(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
