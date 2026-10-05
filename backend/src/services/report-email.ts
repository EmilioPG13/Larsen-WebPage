import { MonthlyReport, UnitRef } from './inventory-report';

const DASH = '—';

const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' });
const dayFormat = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export const monthLabel = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  const name = monthName.format(new Date(Date.UTC(year, number - 1, 1)));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));
const days = (value: number) => `${value} ${value === 1 ? 'día' : 'días'}`;
const units = (value: number) => `${value} ${value === 1 ? 'unidad' : 'unidades'}`;

const unitName = (unit: UnitRef) =>
  `${unit.brand} ${unit.model}, galga ${unit.gauge}, serie ${unit.serialNumber}`;

/**
 * The monthly inventory closing as a plain-text email, with the same sections as the
 * Reportes page of the panel. Plain text, like the lead notification.
 */
export const buildMonthlyReportEmail = (report: MonthlyReport, reportsUrl: string) => {
  const { summary, responseTime, aging } = report;
  const lines: string[] = [];
  const section = (title: string) => lines.push('', title.toUpperCase());

  lines.push(`Cierre de inventario ${DASH} ${monthLabel(report.month)}`);

  section('Resumen');
  lines.push(
    `  Llegadas: ${summary.arrivals}`,
    `  Ventas: ${summary.sales}`,
    `  Apartados: ${summary.reservations}`,
    `  Inventario al cierre: ${summary.stockAtClose.total} (${summary.stockAtClose.available} disponibles, ${summary.stockAtClose.reserved} apartadas)`
  );

  section('Ventas del mes');
  if (report.sales.length === 0) {
    lines.push('  Sin ventas con fecha en este mes.');
  } else {
    for (const sale of report.sales) {
      const stock =
        sale.daysInStock === null ? 'sin fecha de llegada' : `${days(sale.daysInStock)} en bodega`;
      lines.push(`  - ${unitName(sale)} ${DASH} ${formatDay(sale.soldAt)} ${DASH} ${stock}`);
    }
    if (aging.averageDaysToSell !== null) {
      lines.push(`  Tardaron en venderse ${days(aging.averageDaysToSell)} en promedio desde que llegaron.`);
    }
  }

  section('Rapidez de registro (meta: el mismo día)');
  if (responseTime.measured === 0) {
    lines.push('  Sin ventas medibles este mes.');
  } else {
    lines.push(
      `  ${responseTime.sameDay} de ${responseTime.measured} ventas registradas el mismo día.`,
      `  Retraso promedio: ${days(responseTime.averageDays ?? 0)}; el más tardado: ${days(responseTime.worstDays ?? 0)}.`
    );
  }
  if (responseTime.notMeasurable > 0) {
    lines.push(`  ${responseTime.notMeasurable} de la carga inicial del Excel no se pueden medir.`);
  }

  section('Inventario en bodega (a hoy)');
  if (aging.onHand === 0) {
    lines.push('  No hay unidades en bodega.');
  } else {
    const average =
      aging.averageDays === null ? '' : `, ${days(Math.round(aging.averageDays))} de antigüedad en promedio`;
    lines.push(`  ${units(aging.onHand)}${average}.`);
    if (aging.oldest.length > 0) {
      lines.push('  Las más antiguas:');
      for (const unit of aging.oldest) lines.push(`  - ${unitName(unit)} ${DASH} ${days(unit.days)}`);
    }
    if (aging.withoutReceivedDate > 0) {
      lines.push(`  ${units(aging.withoutReceivedDate)} sin fecha de llegada.`);
    }
  }

  section(`Apartadas hace más de ${report.staleAfterDays} días (a hoy)`);
  if (report.staleReservations.length === 0) {
    lines.push('  Ninguna.');
  } else {
    for (const unit of report.staleReservations)
      lines.push(`  - ${unitName(unit)} ${DASH} ${days(unit.days)}`);
  }

  lines.push('', `Ver en el panel: ${reportsUrl}`, '');

  return { subject: `Cierre de inventario: ${monthLabel(report.month)}`, text: lines.join('\n') };
};
