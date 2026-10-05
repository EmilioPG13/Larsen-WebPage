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
import { Alert, Icon, Mark, PageError, PageHeader, PageLoading, type MarkName } from '../components/ui/kit';

const STATUSES: UnitStatus[] = ['DISPONIBLE', 'APARTADA', 'VENDIDA'];

const statusMarks: Record<UnitStatus, MarkName> = {
  DISPONIBLE: 'ring',
  APARTADA: 'slash',
  VENDIDA: 'dot',
};

const GRID = 'md:grid md:grid-cols-[1.3fr_0.45fr_0.9fr_2.3fr_1.2fr_1.5fr] md:items-center md:gap-4';

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

  if (loading && units.length === 0) return <PageLoading>Cargando inventario...</PageLoading>;
  if (loadError && units.length === 0) return <PageError>{loadError}</PageError>;

  return (
    <div className="adm-page">
      <PageHeader
        title="Inventario"
        actions={
          <>
            <button
              onClick={() => {
                setFormError('');
                setFormUnit('new');
              }}
              className="adm-btn adm-btn-primary"
            >
              <Icon name="plus" size={16} />
              Nueva unidad
            </button>
            <ExportMenu busy={exporting} disabled={units.length === 0} onExport={handleExport} />
          </>
        }
      />

      {actionError && <Alert>{actionError}</Alert>}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="adm-seg" role="group" aria-label="Filtrar por estado">
          <button onClick={() => setStatusFilter('')} aria-pressed={statusFilter === ''}>
            Todas ({units.length})
          </button>
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              data-zero={counts[status] === 0}
            >
              <Mark name={statusMarks[status]} size={14} />
              {statusLabels[status]}s ({counts[status]})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[30rem]">
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
              className="adm-input"
            />
          </div>
          <div>
            <label htmlFor="inventory-brand" className="sr-only">
              Filtrar por marca
            </label>
            <Select id="inventory-brand" value={brandFilter} options={brandOptions} onChange={setBrandFilter} />
          </div>
        </div>
      </div>

      <div className="adm-panel">
        <div
          className={`adm-label-sm hidden border-b border-a-line-strong bg-a-surface-2 px-5 py-2.5 ${GRID}`}
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
          <div className="p-8 text-center text-a-muted">
            {units.length === 0 ? 'Todavía no hay unidades en el inventario.' : 'Ninguna unidad coincide con los filtros.'}
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {visible.map((unit) => {
              const last = unit.movements?.[0];
              const busy = busyId === unit.id;
              return (
                <li
                  key={unit.id}
                  className={`space-y-2.5 border-b border-a-line p-4 transition-colors last:border-b-0 hover:bg-a-navy-soft md:space-y-0 md:px-5 ${GRID}`}
                  data-testid="unit-row"
                >
                  <div>
                    <div className="font-semibold text-a-ink">
                      {unit.brand} {unit.model}
                    </div>
                    {unit.modality === 'BAJO_PEDIDO' && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-a-navy">
                        <Mark name="sqslash" size={13} />
                        Bajo pedido
                      </div>
                    )}
                    {unit.notes && <div className="text-[13px] text-a-muted">{unit.notes}</div>}
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-6 md:contents">
                    <div className="adm-num text-a-text2">
                      <span className="text-a-muted md:hidden">Galga </span>
                      {unit.gauge}
                    </div>
                    <div className="adm-num break-all text-[13px] text-a-text2">
                      <span className="font-sans text-a-muted md:hidden">Serie </span>
                      {unit.serialNumber}
                    </div>
                  </div>
                  <div>
                    <div className="adm-seg adm-seg-fill" role="group" aria-label={`Estado de la unidad ${unit.serialNumber}`}>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusClick(unit, status)}
                          disabled={busy}
                          aria-pressed={unit.status === status}
                        >
                          <Mark name={statusMarks[status]} size={14} />
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                    {unit.status === 'VENDIDA' && unit.soldAt && (
                      <div className="mt-1 text-[13px] text-a-muted">
                        Vendida el <span className="adm-num">{formatDate(unit.soldAt)}</span>
                      </div>
                    )}
                    {unit.status === 'APARTADA' && unit.reservedSince && <ReservedNote since={unit.reservedSince} />}
                  </div>
                  <div className="text-[13px] text-a-muted">
                    {last ? (
                      <>
                        <div className="text-a-text2">{movementAuthor(last)}</div>
                        <div className="adm-num">{formatDateTime(last.createdAt)}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <button
                      onClick={() => {
                        setFormError('');
                        setFormUnit(unit);
                      }}
                      aria-label={`Editar ${unit.model} serie ${unit.serialNumber}`}
                      className="adm-link adm-brackets"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setHistoryUnit(unit)}
                      aria-label={`Historial de ${unit.model} serie ${unit.serialNumber}`}
                      className="adm-link adm-link-muted adm-brackets"
                    >
                      Historial
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(unit)}
                        aria-label={`Eliminar ${unit.model} serie ${unit.serialNumber}`}
                        className="adm-link adm-link-danger adm-brackets"
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
        <div className="adm-scrim items-center" role="dialog" aria-modal="true" aria-labelledby="sale-title">
          <div className="adm-dialog max-w-md">
            <div className="adm-dialog-head">
              <h2 id="sale-title" className="adm-dialog-title">
                Marcar como vendida
              </h2>
            </div>
            <div className="adm-dialog-body">
              <p className="m-0 mb-4 text-a-text2">
                {saleTarget.brand} {saleTarget.model} · serie {saleTarget.serialNumber}. Dejará de aparecer en el catálogo del sitio.
              </p>
              <label htmlFor="sale-date" className="adm-field-label">
                Fecha de venta
              </label>
              <DatePicker id="sale-date" value={saleDate} onChange={setSaleDate} />
            </div>
            <div className="adm-dialog-foot">
              <button onClick={confirmSale} className="adm-btn adm-btn-primary">
                Confirmar venta
              </button>
              <button onClick={() => setSaleTarget(null)} className="adm-btn">
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
