import React, { useEffect, useMemo, useState } from 'react';
import { adminApi, type MonthlyReport, type ReportUnitRef } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import Select from '../components/ui/Select';
import { monthOf } from '../utils/inventoryLabels';
import { Alert, Mark, PageHeader, Panel } from '../components/ui/kit';

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
  <Panel title={title} note={note}>
    {children}
  </Panel>
);

const Figure: React.FC<{ label: string; value: number; hint?: string }> = ({ label, value, hint }) => (
  <div className="bg-a-surface p-5">
    <div className="adm-label-sm">{label}</div>
    <div className={`adm-num mt-1 text-[26px] font-medium leading-tight text-a-ink ${value === 0 ? 'adm-dim' : ''}`}>{value}</div>
    {hint && <div className="mt-1 text-[13px] text-a-muted">{hint}</div>}
  </div>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="m-0 text-a-muted">{children}</p>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => <th scope="col">{children}</th>;

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

  const sameDayCells = report
    ? Math.min(report.responseTime.measured, 40)
    : 0;

  return (
    <div className="adm-page">
      <PageHeader
        title="Reportes"
        subtitle="Cierre mensual del inventario."
        actions={
          <div className="w-full sm:w-56">
            <label htmlFor="report-month" className="adm-field-label">
              Mes
            </label>
            <Select
              id="report-month"
              value={month}
              options={months.map((value) => ({ value, label: monthLabel(value) }))}
              onChange={setMonth}
            />
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading && !report && (
        <div role="status" className="adm-label-sm">
          Cargando reporte...
        </div>
      )}

      {report && (
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <div className="adm-panel grid grid-cols-1 gap-px bg-a-line sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="-mx-4 overflow-x-auto sm:-mx-5">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <Th>Unidad</Th>
                        <Th>Serie</Th>
                        <Th>Fecha de venta</Th>
                        <Th>Días en bodega</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.sales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="text-a-ink">
                            {unitName(sale)} <span className="text-a-muted">· galga {sale.gauge}</span>
                          </td>
                          <td className="adm-num text-[13px] text-a-text2">{sale.serialNumber}</td>
                          <td className="adm-num text-[13px] text-a-text2">{formatDay(sale.soldAt)}</td>
                          <td className="adm-num text-[13px] text-a-text2">
                            {sale.daysInStock === null ? 'Sin fecha de llegada' : days(sale.daysInStock)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {report.aging.averageDaysToSell !== null && (
                  <p className="m-0 mt-4 text-a-text2">
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
                <div className="adm-num text-[26px] font-medium text-a-ink">
                  {report.responseTime.sameDay} de {report.responseTime.measured}
                  <span className="ml-1 font-sans text-[14px] font-normal text-a-muted"> registradas el mismo día</span>
                </div>
                <ul
                  role="img"
                  aria-label={`${report.responseTime.sameDay} de ${report.responseTime.measured} ventas registradas el mismo día`}
                  className="adm-chart mt-3"
                  data-size="sm"
                >
                  {Array.from({ length: sameDayCells }, (_, index) => {
                    const onTime = index < Math.round((report.responseTime.sameDay / report.responseTime.measured) * sameDayCells);
                    return (
                      <li key={index} data-mark={onTime ? 'dot' : 'ring'}>
                        <Mark name={onTime ? 'dot' : 'ring'} size={14} />
                      </li>
                    );
                  })}
                </ul>
                <p className="m-0 mt-3 text-a-text2">
                  Promedio: <strong>{days(report.responseTime.averageDays ?? 0)}</strong> de retraso. El más tardado:{' '}
                  <strong>{days(report.responseTime.worstDays ?? 0)}</strong>.
                </p>
              </div>
            )}
            {report.responseTime.notMeasurable > 0 && (
              <p className="adm-note mt-3">
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
                <p className="m-0 text-a-text2">
                  <strong>{report.aging.onHand}</strong> {report.aging.onHand === 1 ? 'unidad' : 'unidades'} en bodega
                  {report.aging.averageDays !== null && (
                    <>
                      , con <strong>{days(Math.round(report.aging.averageDays))}</strong> de antigüedad en promedio
                    </>
                  )}
                  .
                </p>
                {report.aging.oldest.length > 0 && (
                  <div className="-mx-4 mt-4 overflow-x-auto sm:-mx-5">
                    <table className="adm-table">
                      <caption className="adm-label-sm px-4 pb-2 text-left sm:px-5">Las más antiguas</caption>
                      <tbody>
                        {report.aging.oldest.map((unit) => (
                          <tr key={unit.id}>
                            <td className="text-a-ink">
                              {unitName(unit)} <span className="text-a-muted">· galga {unit.gauge}</span>
                            </td>
                            <td className="adm-num text-[13px] text-a-text2">{unit.serialNumber}</td>
                            <td className="adm-num text-[13px] text-a-text2">Llegó el {formatDay(unit.receivedAt)}</td>
                            <td className="adm-num font-medium text-a-ink">{days(unit.days)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {report.aging.withoutReceivedDate > 0 && (
                  <p className="adm-note mt-3">
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
              <ul className="adm-ledger">
                {report.staleReservations.map((unit) => (
                  <li key={unit.id} className="flex-wrap">
                    <span className="text-a-ink">
                      {unitName(unit)} <span className="adm-num text-[13px] text-a-muted">· serie {unit.serialNumber}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-a-red">
                      <Mark name="alert" size={15} />
                      {days(unit.days)} apartada
                    </span>
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
