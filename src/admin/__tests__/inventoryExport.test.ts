import { describe, it, expect } from 'vitest';
import {
  buildInventoryRows,
  createInventoryWorkbook,
  SHEET_HEADERS,
  SHEET_TITLE,
} from '../utils/inventoryExport';
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
  updatedAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

describe('buildInventoryRows', () => {
  it('writes brands the way the company does ("Shima Seiki" -> "Shima")', () => {
    const rows = buildInventoryRows([unit({ brand: 'Shima Seiki', model: '183FF', gauge: '7', serialNumber: '333' })]);

    expect(rows[0][0]).toBe('Shima');
  });

  it('orders by brand (Steiger first), then gauge ascending as a number', () => {
    const rows = buildInventoryRows([
      unit({ brand: 'Shima Seiki', gauge: '5', serialNumber: 'a' }),
      unit({ brand: 'Steiger', gauge: '12', serialNumber: 'b' }),
      unit({ brand: 'Steiger', gauge: '5', serialNumber: 'c' }),
      unit({ brand: 'Steiger', gauge: '10', serialNumber: 'd' }),
    ]);

    expect(rows.map((row) => [row[0], row[1]])).toEqual([
      ['Steiger', 5],
      ['Steiger', 10],
      ['Steiger', 12],
      ['Shima', 5],
    ]);
  });

  it('puts an unknown brand after the two known ones', () => {
    const rows = buildInventoryRows([unit({ brand: 'Protti' }), unit({ brand: 'Shima Seiki' }), unit({ brand: 'Steiger' })]);

    expect(rows.map((row) => row[0])).toEqual(['Steiger', 'Shima', 'Protti']);
  });

  it('keeps gauges and serials the way they would be typed: numbers when numeric, text otherwise', () => {
    const rows = buildInventoryRows([
      unit({ gauge: '7', serialNumber: '392' }),
      unit({ gauge: '5/7', serialNumber: '6212/05' }),
      unit({ gauge: '8', serialNumber: '0001' }),
    ]);

    // A multi-gauge such as "5/7" sorts by its first value, so it comes before 7.
    expect(rows.map((row) => [row[1], row[3]])).toEqual([
      ['5/7', '6212/05'],
      [7, 392],
      [8, '0001'],
    ]);
  });

  it('includes sold units, and writes the status when there is no note so it survives a re-import', () => {
    const rows = buildInventoryRows([
      unit({ serialNumber: '1', status: 'VENDIDA' }),
      unit({ serialNumber: '2', status: 'APARTADA' }),
      unit({ serialNumber: '3', status: 'DISPONIBLE' }),
    ]);

    expect(rows.map((row) => row[4])).toEqual(['Vendida', 'Apartada', '']);
  });

  it('writes the note as is, even on a sold unit', () => {
    const rows = buildInventoryRows([unit({ status: 'VENDIDA', notes: 'Vendida a Luis Leon' })]);

    expect(rows[0][4]).toBe('Vendida a Luis Leon');
  });

  it('does not change the order of the array it receives', () => {
    const input = [unit({ gauge: '12' }), unit({ gauge: '5' })];

    buildInventoryRows(input);

    expect(input.map((u) => u.gauge)).toEqual(['12', '5']);
  });
});

describe('createInventoryWorkbook', () => {
  it('produces a sheet shaped like the company one: merged blue title, headers, then the units', async () => {
    const workbook = await createInventoryWorkbook([
      unit({ brand: 'Steiger', gauge: '7', model: 'Vesta 2+2.240', serialNumber: '392' }),
      unit({ brand: 'Steiger', gauge: '10', model: 'Gemini', serialNumber: '7429', status: 'VENDIDA', notes: 'Vendida a Luis Leon' }),
    ]);

    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe('Hoja1');
    expect(sheet.model.merges).toEqual(['A1:E1']);

    const title = sheet.getCell('A1');
    expect(title.value).toBe(SHEET_TITLE);
    expect(title.fill).toMatchObject({ fgColor: { argb: 'FF227ACB' } });
    expect(title.alignment).toMatchObject({ horizontal: 'center' });

    expect((sheet.getRow(2).values as unknown[]).slice(1)).toEqual([...SHEET_HEADERS]);
    expect((sheet.getRow(3).values as unknown[]).slice(1)).toEqual(['Steiger', 7, 'Vesta 2+2.240', 392, '']);
    expect((sheet.getRow(4).values as unknown[]).slice(1)).toEqual([
      'Steiger',
      10,
      'Gemini',
      7429,
      'Vendida a Luis Leon',
    ]);
    expect(sheet.rowCount).toBe(4);
  });

  it('survives being written and read back as a real .xlsx', async () => {
    const workbook = await createInventoryWorkbook([unit({ serialNumber: '6212/05', gauge: '3', model: 'Vesta 2E3' })]);
    const buffer = await workbook.xlsx.writeBuffer();

    const { default: ExcelJS } = await import('exceljs');
    const reread = new ExcelJS.Workbook();
    await reread.xlsx.load(buffer);

    const row = reread.worksheets[0].getRow(3);
    expect((row.values as unknown[]).slice(1)).toEqual(['Steiger', 3, 'Vesta 2E3', '6212/05', '']);
  });
});
