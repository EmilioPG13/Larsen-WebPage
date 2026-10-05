import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createInventoryWorkbook,
  exportInventoryXlsx,
  INVENTORY_SHEET,
  SHEET_HEADERS,
  SUMMARY_SHEET,
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
  updatedAt: '2026-10-01T15:00:00Z',
  ...overrides,
});

const now = new Date(2026, 9, 2, 15, 0);

const units = [
  unit({ brand: 'Steiger', gauge: '7', model: 'Vesta 2+2.240', serialNumber: '392' }),
  unit({
    brand: 'Steiger',
    gauge: '10',
    model: 'Gemini',
    serialNumber: '7429',
    status: 'VENDIDA',
    soldAt: '2026-09-20',
    notes: 'Vendida a Luis Leon',
  }),
  unit({
    brand: 'Shima Seiki',
    gauge: '7',
    model: '183FF',
    serialNumber: '6561513189751',
    status: 'APARTADA',
    receivedAt: '2026-09-15',
  }),
];

const values = (row: { values: unknown }) => (row.values as unknown[]).slice(1);

describe('createInventoryWorkbook', () => {
  it('has the inventory sheet first and the summary second', async () => {
    const workbook = await createInventoryWorkbook(units, now);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([INVENTORY_SHEET, SUMMARY_SHEET]);
  });

  describe('inventory sheet', () => {
    it('opens with a merged blue title band and the generation line', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.model.merges).toContain('A1:I1');
      expect(sheet.getCell('A1').value).toBe('INVENTARIO BODEGA MEXICO');
      expect(sheet.getCell('A1').fill).toMatchObject({ fgColor: { argb: 'FF28327B' } });
      expect(sheet.getCell('A2').value).toBe('Larsen Italiana  ·  Generado el 2 de octubre de 2026');
    });

    it('keeps the company column names, found by header, plus the status and the dates', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(values(sheet.getRow(4))).toEqual([...SHEET_HEADERS]);
      expect(SHEET_HEADERS.slice(0, 4)).toEqual(['MARCA', 'GALGA', 'MODELO', 'NO. SERIE']);
      expect(SHEET_HEADERS).toContain('OBSERVACIONES');
    });

    it('writes one row per unit in the company order, sold ones included', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.rowCount).toBe(4 + 3);
      expect(values(sheet.getRow(5)).slice(0, 5)).toEqual(['Steiger', 7, 'Vesta 2+2.240', 392, 'Disponible']);
      expect(values(sheet.getRow(6)).slice(0, 5)).toEqual(['Steiger', 10, 'Gemini', 7429, 'Vendida']);
      expect(values(sheet.getRow(7)).slice(0, 5)).toEqual(['Shima', 7, '183FF', 6561513189751, 'Apartada']);
    });

    it('writes dates as real dates in dd/mm/yyyy and keeps the note as typed', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.getCell('G6').value).toEqual(new Date(Date.UTC(2026, 8, 20)));
      expect(sheet.getCell('G6').numFmt).toBe('dd/mm/yyyy');
      expect(sheet.getCell('F7').value).toEqual(new Date(Date.UTC(2026, 8, 15)));
      expect(sheet.getCell('H6').value).toBe('Vendida a Luis Leon');
      expect(sheet.getCell('H5').value).toBe('');
      expect(sheet.getCell('I5').value).toEqual(new Date(Date.UTC(2026, 9, 1)));
    });

    it('shows a long numeric serial in full instead of scientific notation', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.getCell('D7').numFmt).toBe('0');
    });

    it('colors the status cell and dims sold rows', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.getCell('E5').fill).toMatchObject({ fgColor: { argb: 'FFDCFCE7' } });
      expect(sheet.getCell('E6').fill).toMatchObject({ fgColor: { argb: 'FFE5E7EB' } });
      expect(sheet.getCell('E7').fill).toMatchObject({ fgColor: { argb: 'FFFEF3C7' } });
      expect(sheet.getCell('A6').font).toMatchObject({ color: { argb: 'FF6B7280' } });
      expect(sheet.getCell('A5').font).toMatchObject({ color: { argb: 'FF1F2937' } });
    });

    it('freezes the header, filters every column and is set up to print', async () => {
      const sheet = (await createInventoryWorkbook(units, now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 4, showGridLines: false });
      expect(sheet.autoFilter).toEqual({ from: { row: 4, column: 1 }, to: { row: 7, column: 9 } });
      expect(sheet.pageSetup).toMatchObject({
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: '4:4',
      });
    });

    it('still produces a valid sheet with no units', async () => {
      const sheet = (await createInventoryWorkbook([], now)).getWorksheet(INVENTORY_SHEET)!;

      expect(sheet.rowCount).toBe(4);
    });
  });

  describe('summary sheet', () => {
    const rowsOf = async (list: InventoryUnit[]) => {
      const sheet = (await createInventoryWorkbook(list, now)).getWorksheet(SUMMARY_SHEET)!;
      const rows: unknown[][] = [];
      sheet.eachRow((row) => rows.push(values(row)));
      return rows;
    };

    it('shows the total and one figure per status', async () => {
      const rows = await rowsOf(units);

      expect(rows).toContainEqual(['TOTAL', 'DISPONIBLES', 'APARTADAS', 'VENDIDAS']);
      expect(rows).toContainEqual([3, 1, 1, 1]);
    });

    it('breaks the units down by brand, with a total row', async () => {
      const rows = await rowsOf(units);

      expect(rows).toContainEqual(['Steiger', 1, 0, 1, 2]);
      expect(rows).toContainEqual(['Shima', 0, 1, 0, 1]);
      expect(rows).toContainEqual(['Total', 1, 1, 1, 3]);
    });

    it('lists the gauges with units on hand and the models that have them', async () => {
      const rows = await rowsOf(units);

      // The models cell is merged across three columns, which exceljs repeats in the row values.
      expect(rows.map((row) => row.slice(0, 3))).toContainEqual([7, 1, 'Vesta 2+2.240']);
    });

    it('groups the sales by month', async () => {
      const rows = await rowsOf(units);

      expect(rows).toContainEqual(['Septiembre 2026', 1]);
    });

    it('says so when there are no sales or no units on hand', async () => {
      const texts = (await rowsOf([unit({ status: 'APARTADA' })])).flat();

      expect(texts).toContain('Sin unidades disponibles');
      expect(texts).toContain('Sin ventas registradas');
    });
  });

  it('survives being written and read back as a real .xlsx', async () => {
    const workbook = await createInventoryWorkbook(
      [unit({ serialNumber: '6212/05', gauge: '3', model: 'Vesta 2E3', receivedAt: '2026-09-15' })],
      now,
    );
    const buffer = await workbook.xlsx.writeBuffer();

    const { default: ExcelJS } = await import('exceljs');
    const reread = new ExcelJS.Workbook();
    await reread.xlsx.load(buffer);

    const sheet = reread.getWorksheet(INVENTORY_SHEET)!;
    expect(values(sheet.getRow(5)).slice(0, 6)).toEqual([
      'Steiger',
      3,
      'Vesta 2E3',
      '6212/05',
      'Disponible',
      new Date(Date.UTC(2026, 8, 15)),
    ]);
    expect(reread.getWorksheet(SUMMARY_SHEET)).toBeDefined();
  });
});

describe('exportInventoryXlsx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads the workbook with the local date in its name', async () => {
    const created = vi.fn(() => 'blob:fake');
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: vi.fn() });
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });

    await exportInventoryXlsx(units, now);

    expect(downloads).toEqual(['INVENTARIO BODEGA MEXICO (2026-10-02).xlsx']);
    const blob = (created.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
});
