import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { Icon, Mark, PageError, PageHeader, PageLoading, Panel, type MarkName } from '../components/ui/kit';

interface Stats {
  leads: {
    total: number;
    newToday: number;
    new: number;
  };
  products: {
    total: number;
    inStock: number;
    outOfStock: number;
  };
  machines: {
    total: number;
    inStock: number;
    outOfStock: number;
  };
  inventory: {
    available: number;
    reserved: number;
    sold: number;
  };
}

interface Series {
  key: string;
  label: string;
  mark: MarkName;
  count: number;
}

/**
 * Shares out `cap` cells between the series so the chart stays readable with
 * hundreds of units. Every non-empty series keeps at least one cell.
 */
const allocateCells = (series: Series[], cap: number): number[] => {
  const total = series.reduce((sum, item) => sum + item.count, 0);
  if (total <= cap) return series.map((item) => item.count);
  const cells = series.map((item) => (item.count === 0 ? 0 : Math.max(1, Math.floor((item.count / total) * cap))));
  let used = cells.reduce((sum, value) => sum + value, 0);
  const order = series.map((_, index) => index).sort((a, b) => series[b].count - series[a].count);
  for (let i = 0; used < cap; i = (i + 1) % order.length) {
    if (series[order[i]].count > 0) {
      cells[order[i]] += 1;
      used += 1;
    }
  }
  return cells;
};

const UnitChart: React.FC<{ series: Series[]; cap?: number; size?: 'md' | 'sm' }> = ({
  series,
  cap = 96,
  size = 'md',
}) => {
  const total = series.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return <p className="m-0 text-a-muted">Todavía no hay registros.</p>;

  const cells = allocateCells(series, cap);
  const scaled = total > cap;
  const description = series.map((item) => `${item.label}: ${item.count}`).join(', ');

  return (
    <div>
      <ul role="img" aria-label={description} className="adm-chart" data-size={size}>
        {series.flatMap((item, index) =>
          Array.from({ length: cells[index] }, (_, cell) => (
            <li key={`${item.key}-${cell}`} data-mark={item.mark}>
              <Mark name={item.mark} size={size === 'sm' ? 14 : 18} />
            </li>
          )),
        )}
      </ul>
      {scaled && (
        <p className="adm-note mt-3">
          Cada celda agrupa unas {Math.round(total / cap)} unidades.
        </p>
      )}
    </div>
  );
};

const Legend: React.FC<{ series: Series[] }> = ({ series }) => (
  <ul className="adm-ledger">
    {series.map((item) => (
      <li key={item.key}>
        <span className="adm-ledger-term">
          <Mark name={item.mark} size={18} className="text-a-navy" />
          {item.label}
        </span>
        <span className={`adm-ledger-value ${item.count === 0 ? 'adm-dim' : ''}`}>{item.count}</span>
      </li>
    ))}
  </ul>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        setError(apiErrorMessage(err, 'Error al cargar estadísticas'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <PageLoading>Cargando estadísticas...</PageLoading>;
  if (error) return <PageError>{error}</PageError>;
  if (!stats) return null;

  const units: Series[] = [
    { key: 'available', label: 'Disponibles', mark: 'ring', count: stats.inventory?.available ?? 0 },
    { key: 'reserved', label: 'Apartadas', mark: 'slash', count: stats.inventory?.reserved ?? 0 },
    { key: 'sold', label: 'Vendidas', mark: 'dot', count: stats.inventory?.sold ?? 0 },
  ];
  const unitTotal = units.reduce((sum, item) => sum + item.count, 0);

  const stockSeries = (group: { inStock: number; outOfStock: number }): Series[] => [
    { key: 'in', label: 'En Stock', mark: 'ring', count: group.inStock },
    { key: 'out', label: 'Sin Stock', mark: 'cross', count: group.outOfStock },
  ];

  const leads: Series[] = [
    { key: 'new', label: 'Sin atender', mark: 'sq', count: stats.leads.new },
    { key: 'today', label: 'Nuevos hoy', mark: 'sqslash', count: stats.leads.newToday },
    { key: 'total', label: 'Total', mark: 'sqdash', count: stats.leads.total },
  ];

  return (
    <div className="adm-page">
      <PageHeader title="Dashboard" subtitle="Estado del inventario y de los leads al día de hoy." />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Unidades en inventario"
          note="Una celda por unidad física."
          aside={
            <span className="adm-num text-[13px] text-a-muted">
              {unitTotal} {unitTotal === 1 ? 'unidad' : 'unidades'}
            </span>
          }
        >
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <UnitChart series={units} />
            <Legend series={units} />
          </div>
        </Panel>

        <Panel
          title="Total Leads"
          aside={
            <Link to="/admin/leads" className="adm-link adm-brackets">
              Ver leads
              <Icon name="arrow" size={16} className="ml-1" />
            </Link>
          }
        >
          <Legend series={leads} />
        </Panel>

        {/* One plate under the units plate, split in two halves on the same column grid */}
        <section className="adm-panel grid grid-cols-1 gap-px bg-a-line md:grid-cols-2">
          {[
            { title: 'Productos', group: stats.products },
            { title: 'Máquinas', group: stats.machines },
          ].map(({ title, group }) => (
            <div key={title} className="bg-a-surface">
              <div className="adm-panel-head">
                <h2 className="adm-panel-title">{title}</h2>
                <span className="adm-num text-[13px] text-a-muted">{group.total}</span>
              </div>
              <div className="adm-panel-body space-y-5">
                <UnitChart series={stockSeries(group)} cap={60} />
                <Legend series={stockSeries(group)} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
