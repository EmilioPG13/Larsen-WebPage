import { describe, it, expect } from 'vitest';
import { buildReportRows, buildSummary, exportFileName, formatDay, generatedLabel } from '../utils/inventoryReport';
import type { InventoryUnit } from '../services/adminApi';

const unit = (overrides: Partial<InventoryUnit>): InventoryUnit => ({
  id: 'id',
  brand: 'Steiger',
  model: 'Gemini',
  gauge: '5',
  serialNumber: '1',
  status: 'DISPONIBLE',
  modality: 'EN_BODEGA',
  receivedAt: null,
  soldAt: null,
  notes: null,
  machineId: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T15:00:00Z',
  ...overrides,
});

describe('buildReportRows', () => {
  it('writes brands the way the company does ("Shima Seiki" -> "Shima")', () => {
    const rows = buildReportRows([unit({ brand: 'Shima Seiki', model: '183FF', gauge: '7', serialNumber: '333' })]);

    expect(rows[0].brand).toBe('Shima');
  });

  it('orders by brand (Steiger first), then gauge ascending as a number', () => {
    const rows = buildReportRows([
      unit({ brand: 'Shima Seiki', gauge: '5', serialNumber: 'a' }),
      unit({ brand: 'Steiger', gauge: '12', serialNumber: 'b' }),
      unit({ brand: 'Steiger', gauge: '5', serialNumber: 'c' }),
      unit({ brand: 'Steiger', gauge: '10', serialNumber: 'd' }),
    ]);

    expect(rows.map((row) => [row.brand, row.gauge])).toEqual([
      ['Steiger', 5],
      ['Steiger', 10],
      ['Steiger', 12],
      ['Shima', 5],
    ]);
  });

  it('puts an unknown brand after the two known ones', () => {
    const rows = buildReportRows([unit({ brand: 'Protti' }), unit({ brand: 'Shima Seiki' }), unit({ brand: 'Steiger' })]);

    expect(rows.map((row) => row.brand)).toEqual(['Steiger', 'Shima', 'Protti']);
  });

  it('keeps gauges and serials the way they would be typed: numbers when numeric, text otherwise', () => {
    const rows = buildReportRows([
      unit({ gauge: '7', serialNumber: '392' }),
      unit({ gauge: '5/7', serialNumber: '6212/05' }),
      unit({ gauge: '8', serialNumber: '0001' }),
    ]);

    // A multi-gauge such as "5/7" sorts by its first value, so it comes before 7.
    expect(rows.map((row) => [row.gauge, row.serial])).toEqual([
      ['5/7', '6212/05'],
      [7, 392],
      [8, '0001'],
    ]);
  });

  it('includes sold units and keeps the note as typed, without inventing text from the status', () => {
    const rows = buildReportRows([
      unit({ serialNumber: '1', status: 'VENDIDA' }),
      unit({ serialNumber: '2', status: 'VENDIDA', notes: 'Vendida a Luis Leon' }),
    ]);

    expect(rows.map((row) => [row.status, row.notes])).toEqual([
      ['VENDIDA', ''],
      ['VENDIDA', 'Vendida a Luis Leon'],
    ]);
  });

  it('turns stored dates into midnight UTC so Excel shows the same day everywhere', () => {
    const [row] = buildReportRows([
      unit({ receivedAt: '2026-09-20T00:00:00.000Z', soldAt: '2026-10-01', updatedAt: '2026-10-01T15:00:00Z' }),
    ]);

    expect(row.receivedAt).toEqual(new Date(Date.UTC(2026, 8, 20)));
    expect(row.soldAt).toEqual(new Date(Date.UTC(2026, 9, 1)));
    expect(row.updatedAt).toEqual(new Date(Date.UTC(2026, 9, 1)));
  });

  it('leaves missing dates empty', () => {
    const [row] = buildReportRows([unit({})]);

    expect(row.receivedAt).toBeNull();
    expect(row.soldAt).toBeNull();
  });

  it('does not change the order of the array it receives', () => {
    const input = [unit({ gauge: '12' }), unit({ gauge: '5' })];

    buildReportRows(input);

    expect(input.map((u) => u.gauge)).toEqual(['12', '5']);
  });
});

describe('buildSummary', () => {
  const units = [
    unit({ brand: 'Steiger', gauge: '7', model: 'Vesta 130E', serialNumber: 'a' }),
    unit({ brand: 'Steiger', gauge: '7', model: 'Vesta 2X3', serialNumber: 'b' }),
    unit({ brand: 'Steiger', gauge: '7', model: 'Vesta 130E', serialNumber: 'c' }),
    unit({ brand: 'Steiger', gauge: '5', model: 'Gemini', serialNumber: 'd', status: 'APARTADA' }),
    unit({ brand: 'Steiger', gauge: '10', model: 'Gemini', serialNumber: 'e', status: 'VENDIDA', soldAt: '2026-09-20' }),
    unit({ brand: 'Shima Seiki', gauge: '12', model: '234S', serialNumber: 'f' }),
    unit({ brand: 'Shima Seiki', gauge: '7', model: '183FF', serialNumber: 'g', status: 'VENDIDA', soldAt: '2026-09-02' }),
    unit({ brand: 'Shima Seiki', gauge: '7', model: '183FF', serialNumber: 'h', status: 'VENDIDA', soldAt: '2026-10-01' }),
    unit({ brand: 'Shima Seiki', gauge: '5', model: '234CS', serialNumber: 'i', status: 'VENDIDA' }),
  ];

  it('counts the units by status', () => {
    expect(buildSummary(units)).toMatchObject({ total: 9, available: 4, reserved: 1, sold: 4 });
  });

  it('breaks the counts down by brand, Steiger first, with company brand names', () => {
    expect(buildSummary(units).byBrand).toEqual([
      { brand: 'Steiger', available: 3, reserved: 1, sold: 1, total: 5 },
      { brand: 'Shima', available: 1, reserved: 0, sold: 3, total: 4 },
    ]);
  });

  it('lists only the units on hand by gauge, ascending, with each model once', () => {
    expect(buildSummary(units).availableByGauge).toEqual([
      { gauge: 7, count: 3, models: ['Vesta 130E', 'Vesta 2X3'] },
      { gauge: 12, count: 1, models: ['234S'] },
    ]);
  });

  it('groups sales by the month of the sale date, oldest first, and counts the ones with no date', () => {
    const summary = buildSummary(units);

    expect(summary.salesByMonth).toEqual([
      { month: '2026-09', label: 'Septiembre 2026', count: 2 },
      { month: '2026-10', label: 'Octubre 2026', count: 1 },
    ]);
    expect(summary.soldWithoutDate).toBe(1);
  });

  it('copes with an empty inventory', () => {
    expect(buildSummary([])).toEqual({
      total: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      byBrand: [],
      availableByGauge: [],
      salesByMonth: [],
      soldWithoutDate: 0,
    });
  });
});

describe('report labels', () => {
  const now = new Date(2026, 9, 2, 15, 0);

  it('writes the generation date in Spanish', () => {
    expect(generatedLabel(now)).toBe('Generado el 2 de octubre de 2026');
  });

  it('names the file with the local date', () => {
    expect(exportFileName('xlsx', now)).toBe('INVENTARIO BODEGA MEXICO (2026-10-02).xlsx');
    expect(exportFileName('pdf', now)).toBe('INVENTARIO BODEGA MEXICO (2026-10-02).pdf');
  });

  it('formats a day as dd/mm/aaaa and an empty one as nothing', () => {
    expect(formatDay(new Date(Date.UTC(2026, 8, 5)))).toBe('05/09/2026');
    expect(formatDay(null)).toBe('');
  });
});
