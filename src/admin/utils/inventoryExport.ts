import type { InventoryUnit } from '../services/adminApi';

/**
 * Builds the inventory sheet the company already uses ("INVENTARIO BODEGA
 * MEXICO": title row, MARCA / GALGA / MODELO / NO. SERIE / OBSERVACIONES), so
 * the export can replace their Excel and be imported back without losing the
 * status of any unit.
 */

export const SHEET_TITLE = 'INVENTARIO BODEGA MEXICO';
export const SHEET_HEADERS = ['MARCA', 'GALGA', 'MODELO', 'NO. SERIE', 'OBSERVACIONES'] as const;

// Brands as the company writes them in its sheet (the site uses "Shima Seiki").
const SHEET_BRAND: Record<string, string> = { 'Shima Seiki': 'Shima' };
// Steiger first, like their sheet; any other brand follows alphabetically.
const BRAND_ORDER = ['Steiger', 'Shima'];

const sheetBrand = (brand: string) => SHEET_BRAND[brand] ?? brand;

const brandRank = (brand: string) => {
  const index = BRAND_ORDER.indexOf(sheetBrand(brand));
  return index === -1 ? BRAND_ORDER.length : index;
};

/** Gauge as a number when it is one ("7"), otherwise as text ("5/7"). */
const gaugeCell = (gauge: string): string | number => (/^\d+(\.\d+)?$/.test(gauge) ? Number(gauge) : gauge);

/** Serial as a number only when the company would type it as one (392), never "0001" or "6212/05". */
const serialCell = (serial: string): string | number => (/^[1-9]\d{0,14}$/.test(serial) ? Number(serial) : serial);

/**
 * OBSERVACIONES carries the note. A reserved or sold unit with no note gets
 * "Apartada" / "Vendida" so the status survives re-importing the sheet.
 */
const observations = (unit: InventoryUnit): string => {
  if (unit.notes) return unit.notes;
  if (unit.status === 'VENDIDA') return 'Vendida';
  if (unit.status === 'APARTADA') return 'Apartada';
  return '';
};

export type SheetRow = [string, string | number, string, string | number, string];

/** Rows in the company's order: brand (Steiger first), then gauge ascending, then model and serial. Sold units included. */
export const buildInventoryRows = (units: InventoryUnit[]): SheetRow[] =>
  [...units]
    .sort(
      (a, b) =>
        brandRank(a.brand) - brandRank(b.brand) ||
        sheetBrand(a.brand).localeCompare(sheetBrand(b.brand)) ||
        parseFloat(a.gauge) - parseFloat(b.gauge) ||
        a.gauge.localeCompare(b.gauge) ||
        a.model.localeCompare(b.model) ||
        a.serialNumber.localeCompare(b.serialNumber, undefined, { numeric: true })
    )
    .map((unit) => [
      sheetBrand(unit.brand),
      gaugeCell(unit.gauge),
      unit.model,
      serialCell(unit.serialNumber),
      observations(unit),
    ]);

const FONT = { name: 'Tw Cen MT', size: 11 };

/** exceljs is loaded on demand: it is large and only the admin ever needs it. */
export const createInventoryWorkbook = async (units: InventoryUnit[]) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Hoja1', { views: [{ zoomScale: 140 }] });

  sheet.columns = [{ width: 7.6 }, { width: 7.7 }, { width: 12.7 }, { width: 9.3 }, { width: 15.4 }];

  sheet.mergeCells('A1:E1');
  const title = sheet.getCell('A1');
  title.value = SHEET_TITLE;
  title.font = FONT;
  title.alignment = { horizontal: 'center' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF227ACB' } };

  sheet.addRow([...SHEET_HEADERS]).font = FONT;

  buildInventoryRows(units).forEach((values) => {
    const row = sheet.addRow(values);
    row.font = FONT;
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'left' };
  });

  return workbook;
};

/** Builds the sheet and downloads it from the browser. */
export const exportInventoryXlsx = async (units: InventoryUnit[], now: Date = new Date()) => {
  const workbook = await createInventoryWorkbook(units);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  // Local date: the UTC one would already be "tomorrow" in the afternoon in Mexico.
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  link.download = `INVENTARIO BODEGA MEXICO (${day}).xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};
