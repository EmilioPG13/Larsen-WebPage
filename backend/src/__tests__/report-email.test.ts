import { buildMonthlyReportEmail, monthLabel } from '../services/report-email';
import { MonthlyReport } from '../services/inventory-report';

const URL = 'https://larsenitaliana.com/admin/reportes';

const unit = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  brand: 'Steiger',
  model: 'Vesta 130E',
  gauge: '7',
  serialNumber: '4738/96',
  ...overrides,
});

const report = (overrides: Partial<MonthlyReport> = {}): MonthlyReport => ({
  month: '2026-09',
  summary: { arrivals: 2, sales: 1, reservations: 3, stockAtClose: { available: 12, reserved: 2, total: 14 } },
  sales: [{ ...unit({ model: 'Gemini', gauge: '10', serialNumber: '7429' }), soldAt: '2026-09-20', daysInStock: 35 }],
  responseTime: { measured: 3, sameDay: 2, averageDays: 1.3, worstDays: 3, notMeasurable: 1 },
  aging: {
    onHand: 14,
    withReceivedDate: 2,
    withoutReceivedDate: 12,
    averageDays: 45.3,
    oldest: [{ ...unit(), receivedAt: '2026-07-22', days: 90 }],
    averageDaysToSell: 35,
  },
  staleAfterDays: 15,
  staleReservations: [{ ...unit({ model: '183FF', gauge: '7', serialNumber: '333' }), since: '2026-09-01', days: 49 }],
  ...overrides,
});

describe('monthLabel', () => {
  it('writes the month in Spanish with a capital letter', () => {
    expect(monthLabel('2026-09')).toBe('Septiembre 2026');
    expect(monthLabel('2027-01')).toBe('Enero 2027');
  });
});

describe('buildMonthlyReportEmail', () => {
  it('puts the month in the subject', () => {
    expect(buildMonthlyReportEmail(report(), URL).subject).toBe('Cierre de inventario: Septiembre 2026');
  });

  it('writes every section of the closing', () => {
    const { text } = buildMonthlyReportEmail(report(), URL);

    expect(text).toContain('Cierre de inventario — Septiembre 2026');
    expect(text).toContain('Llegadas: 2');
    expect(text).toContain('Ventas: 1');
    expect(text).toContain('Apartados: 3');
    expect(text).toContain('Inventario al cierre: 14 (12 disponibles, 2 apartadas)');
    expect(text).toContain('- Steiger Gemini, galga 10, serie 7429 — 20 sep 2026 — 35 días en bodega');
    expect(text).toContain('Tardaron en venderse 35 días en promedio desde que llegaron.');
    expect(text).toContain('2 de 3 ventas registradas el mismo día.');
    expect(text).toContain('Retraso promedio: 1.3 días; el más tardado: 3 días.');
    expect(text).toContain('1 de la carga inicial del Excel no se pueden medir.');
    expect(text).toContain('14 unidades, 45 días de antigüedad en promedio.');
    expect(text).toContain('- Steiger Vesta 130E, galga 7, serie 4738/96 — 90 días');
    expect(text).toContain('12 unidades sin fecha de llegada.');
    expect(text).toContain('APARTADAS HACE MÁS DE 15 DÍAS (A HOY)');
    expect(text).toContain('- Steiger 183FF, galga 7, serie 333 — 49 días');
    expect(text).toContain(`Ver en el panel: ${URL}`);
  });

  it('says so when there is nothing to report', () => {
    const empty = report({
      summary: { arrivals: 0, sales: 0, reservations: 0, stockAtClose: { available: 0, reserved: 0, total: 0 } },
      sales: [],
      responseTime: { measured: 0, sameDay: 0, averageDays: null, worstDays: null, notMeasurable: 0 },
      aging: {
        onHand: 0,
        withReceivedDate: 0,
        withoutReceivedDate: 0,
        averageDays: null,
        oldest: [],
        averageDaysToSell: null,
      },
      staleReservations: [],
    });

    const { text } = buildMonthlyReportEmail(empty, URL);

    expect(text).toContain('Sin ventas con fecha en este mes.');
    expect(text).toContain('Sin ventas medibles este mes.');
    expect(text).toContain('No hay unidades en bodega.');
    expect(text).toContain('Ninguna.');
    expect(text).not.toContain('de la carga inicial');
  });

  it('handles a sale with no arrival date and singular wording', () => {
    const { text } = buildMonthlyReportEmail(
      report({
        sales: [{ ...unit(), soldAt: '2026-09-05', daysInStock: null }],
        aging: { ...report().aging, onHand: 1, withoutReceivedDate: 1, averageDaysToSell: null },
        responseTime: { measured: 1, sameDay: 1, averageDays: 1, worstDays: 1, notMeasurable: 0 },
      }),
      URL
    );

    expect(text).toContain('— sin fecha de llegada');
    expect(text).toContain('1 unidad sin fecha de llegada.');
    expect(text).toContain('Retraso promedio: 1 día; el más tardado: 1 día.');
    expect(text).not.toContain('Tardaron en venderse');
  });

  it('is plain text: a unit name with markup is written as is, never interpreted', () => {
    const { text } = buildMonthlyReportEmail(
      report({ staleReservations: [{ ...unit({ model: '<b>x</b>' }), since: '2026-09-01', days: 20 }] }),
      URL
    );

    expect(text).toContain('<b>x</b>');
  });
});
