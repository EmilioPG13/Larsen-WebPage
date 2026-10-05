import React, { useEffect, useMemo, useState } from 'react';
import { adminApi, type MonthlyReport, type ReportUnitRef } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import Select from '../components/ui/Select';
import { monthOf } from '../utils/inventoryLabels';

const MONTHS_LISTED = 12;

const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' });

const monthLabel = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  const name = monthName.format(new Date(Date.UTC(year, number - 1, 1)));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

/** The current month and the previous ones, newest first. */
const recentMonths = (current: string) => {
  const [year, number] = current.split('-').map(Number);
  return Array.from({ length: MONTHS_LISTED }, (_, index) => {
    const date = new Date(Date.UTC(year, number - 1 - index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

const dayFormat = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));

const unitName = (unit: ReportUnitRef) => `${unit.brand} ${unit.model}`;
const days = (value: number) => `${value} ${value === 1 ? 'día' : 'días'}`;

const Card: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({ title, note, children }) => (
  <section className="bg-white rounded-lg shadow-md p-5 sm:p-6">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Figure: React.FC<{ label: string; value: number; hint?: string }> = ({ label, value, hint }) => (
  <div className="bg-white rounded-lg shadow-md p-5">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-4xl font-bold text-larsen-blue mt-1">{value}</div>
    {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
  </div>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
);

const Reports: React.FC = () => {
  const current = useMemo(() => monthOf(), []);
  const months = useMemo(() => recentMonths(current), [current]);
  const [month, setMonth] = useState(current);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    adminApi
      .getMonthlyReport(month)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Error al cargar el reporte'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const isCurrent = month === current;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-600 mt-1">Cierre mensual del inventario.</p>
        </div>
        <div className="w-full sm:w-56">
          <label htmlFor="report-month" className="block text-sm font-medium text-gray-700 mb-1">
            Mes
          </label>
          <Select
            id="report-month"
            value={month}
            options={months.map((value) => ({ value, label: monthLabel(value) }))}
            onChange={setMonth}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          {error}
        </div>
      )}

      {loading && !report && <div className="text-gray-600">Cargando reporte...</div>}

      {report && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Figure label="Llegadas" value={report.summary.arrivals} hint="Unidades con fecha de llegada en el mes" />
            <Figure label="Ventas" value={report.summary.sales} hint="Unidades con fecha de venta en el mes" />
            <Figure label="Apartados" value={report.summary.reservations} hint="Veces que se apartó una unidad" />
            <Figure
              label={isCurrent ? 'Inventario hoy' : 'Inventario al cierre'}
              value={report.summary.stockAtClose.total}
              hint={`${report.summary.stockAtClose.available} disponibles · ${report.summary.stockAtClose.reserved} apartadas`}
            />
          </div>

          <Card title="Ventas del mes">
            {report.sales.length === 0 ? (
              <Empty>No hay ventas con fecha en este mes.</Empty>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium uppercase text-gray-500">
                        <th className="py-2 pr-4">Unidad</th>
                        <th className="py-2 pr-4">Serie</th>
                        <th className="py-2 pr-4">Fecha de venta</th>
                        <th className="py-2">Días en bodega</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.sales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="py-2 pr-4 text-gray-900">
                            {unitName(sale)} <span className="text-gray-500">· galga {sale.gauge}</span>
                          </td>
                          <td className="py-2 pr-4 text-gray-700">{sale.serialNumber}</td>
                          <td className="py-2 pr-4 text-gray-700">{formatDay(sale.soldAt)}</td>
                          <td className="py-2 text-gray-700">
                            {sale.daysInStock === null ? 'Sin fecha de llegada' : days(sale.daysInStock)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.aging.averageDaysToSell !== null && (
                  <p className="text-sm text-gray-700 mt-4">
                    Tardaron en venderse <strong>{days(report.aging.averageDaysToSell)}</strong> en promedio desde que
                    llegaron.
                  </p>
                )}
              </>
            )}
          </Card>

          <Card title="Rapidez de registro" note="Meta: registrar cada venta el mismo día en que ocurre.">
            {report.responseTime.measured === 0 ? (
              <Empty>No hay ventas del mes que se puedan medir.</Empty>
            ) : (
              <div>
                <div className="text-3xl font-bold text-larsen-blue">
                  {report.responseTime.sameDay} de {report.responseTime.measured}
                  <span className="text-base font-medium text-gray-600"> registradas el mismo día</span>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  Promedio: <strong>{days(report.responseTime.averageDays ?? 0)}</strong> de retraso. El más tardado:{' '}
                  <strong>{days(report.responseTime.worstDays ?? 0)}</strong>.
                </p>
              </div>
            )}
            {report.responseTime.notMeasurable > 0 && (
              <p className="text-xs text-gray-500 mt-3">
                {report.responseTime.notMeasurable === 1
                  ? '1 venta viene de la carga inicial del Excel y no se puede medir.'
                  : `${report.responseTime.notMeasurable} ventas vienen de la carga inicial del Excel y no se pueden medir.`}
              </p>
            )}
          </Card>

          <Card title="Inventario en bodega" note="Al día de hoy, sin importar el mes elegido.">
            {report.aging.onHand === 0 ? (
              <Empty>No hay unidades en bodega.</Empty>
            ) : (
              <>
                <p className="text-sm text-gray-700">
                  <strong>{report.aging.onHand}</strong> {report.aging.onHand === 1 ? 'unidad' : 'unidades'} en bodega
                  {report.aging.averageDays !== null && (
                    <>
                      , con <strong>{days(Math.round(report.aging.averageDays))}</strong> de antigüedad en promedio
                    </>
                  )}
                  .
                </p>
                {report.aging.oldest.length > 0 && (
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full text-sm">
                      <caption className="text-left text-xs font-medium uppercase text-gray-500 pb-2">
                        Las más antiguas
                      </caption>
                      <tbody className="divide-y divide-gray-100">
                        {report.aging.oldest.map((unit) => (
                          <tr key={unit.id}>
                            <td className="py-2 pr-4 text-gray-900">
                              {unitName(unit)} <span className="text-gray-500">· galga {unit.gauge}</span>
                            </td>
                            <td className="py-2 pr-4 text-gray-700">{unit.serialNumber}</td>
                            <td className="py-2 pr-4 text-gray-700">Llegó el {formatDay(unit.receivedAt)}</td>
                            <td className="py-2 font-medium text-gray-900">{days(unit.days)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {report.aging.withoutReceivedDate > 0 && (
                  <p className="text-xs text-gray-500 mt-3">
                    {report.aging.withoutReceivedDate === 1
                      ? '1 unidad no tiene fecha de llegada'
                      : `${report.aging.withoutReceivedDate} unidades no tienen fecha de llegada`}
                    : captúrala al editarla para medir su antigüedad.
                  </p>
                )}
              </>
            )}
          </Card>

          <Card
            title={`Apartadas hace más de ${report.staleAfterDays} días`}
            note="Al día de hoy. Conviene confirmar la venta o liberar la unidad."
          >
            {report.staleReservations.length === 0 ? (
              <Empty>Ninguna: todas las unidades apartadas están al día.</Empty>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {report.staleReservations.map((unit) => (
                  <li key={unit.id} className="py-2 flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="text-gray-900">
                      {unitName(unit)} <span className="text-gray-500">· serie {unit.serialNumber}</span>
                    </span>
                    <span className="font-semibold text-amber-700">⚠ {days(unit.days)} apartada</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
