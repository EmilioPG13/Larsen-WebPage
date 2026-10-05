import type { InventoryUnit, UnitStatus } from '../services/adminApi';
import { statusLabels } from './inventoryLabels';

/** Data and presentation constants shared by the Excel and the PDF exports. */

export const COMPANY = 'Larsen Italiana';
export const REPORT_TITLE = 'INVENTARIO BODEGA MEXICO';

/** Brand colors and the status palette (matches the pills of the admin panel). ARGB without the alpha prefix. */
export const COLORS = {
  blue: '28327B',
  red: 'D81E2A',
  ink: '1F2937',
  muted: '6B7280',
  line: 'E5E7EB',
  headFill: 'EEF0F8',
  zebra: 'F7F8FC',
} as const;

export const STATUS_COLORS: Record<UnitStatus, { fill: string; text: string }> = {
  DISPONIBLE: { fill: 'DCFCE7', text: '166534' },
  APARTADA: { fill: 'FEF3C7', text: '92400E' },
  VENDIDA: { fill: 'E5E7EB', text: '4B5563' },
};

// Brands as the company writes them in its sheet (the site uses "Shima Seiki").
const SHEET_BRAND: Record<string, string> = { 'Shima Seiki': 'Shima' };
// Steiger first, like their sheet; any other brand follows alphabetically.
const BRAND_ORDER = ['Steiger', 'Shima'];

const sheetBrand = (brand: string) => SHEET_BRAND[brand] ?? brand;

const brandRank = (brand: string) => {
  const index = BRAND_ORDER.indexOf(sheetBrand(brand));
  return index === -1 ? BRAND_ORDER.length : index;
};

const compareBrands = (a: string, b: string) =>
  brandRank(a) - brandRank(b) || sheetBrand(a).localeCompare(sheetBrand(b));

/** Gauge as a number when it is one ("7"), otherwise as text ("5/7"). */
const gaugeCell = (gauge: string): string | number => (/^\d+(\.\d+)?$/.test(gauge) ? Number(gauge) : gauge);

/** Serial as a number only when the company would type it as one (392), never "0001" or "6212/05". */
const serialCell = (serial: string): string | number => (/^[1-9]\d{0,14}$/.test(serial) ? Number(serial) : serial);

/** A stored calendar day (`YYYY-MM-DD...`) as midnight UTC, which is how Excel keeps a date without a time zone. */
const calendarDate = (iso: string | null): Date | null => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`) : null);

/** The local calendar day of a timestamp, as midnight UTC (the UTC day would already be "tomorrow" in Mexico at night). */
const localCalendarDate = (iso: string): Date => {
  const date = new Date(iso);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

export interface ReportRow {
  brand: string;
  gauge: string | number;
  model: string;
  serial: string | number;
  status: UnitStatus;
  receivedAt: Date | null;
  soldAt: Date | null;
  notes: string;
  updatedAt: Date;
}

/** Rows in the company's order: brand (Steiger first), then gauge ascending, then model and serial. Sold units included. */
export const buildReportRows = (units: InventoryUnit[]): ReportRow[] =>
  [...units]
    .sort(
      (a, b) =>
        compareBrands(a.brand, b.brand) ||
        parseFloat(a.gauge) - parseFloat(b.gauge) ||
        a.gauge.localeCompare(b.gauge) ||
        a.model.localeCompare(b.model) ||
        a.serialNumber.localeCompare(b.serialNumber, undefined, { numeric: true }),
    )
    .map((unit) => ({
      brand: sheetBrand(unit.brand),
      gauge: gaugeCell(unit.gauge),
      model: unit.model,
      serial: serialCell(unit.serialNumber),
      status: unit.status,
      receivedAt: calendarDate(unit.receivedAt),
      soldAt: calendarDate(unit.soldAt),
      notes: unit.notes ?? '',
      updatedAt: localCalendarDate(unit.updatedAt),
    }));

export interface BrandSummary {
  brand: string;
  available: number;
  reserved: number;
  sold: number;
  total: number;
}

export interface InventorySummary {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  byBrand: BrandSummary[];
  /** Units on hand (not reserved, not sold) per gauge, with the models that have it. */
  availableByGauge: { gauge: string | number; count: number; models: string[] }[];
  salesByMonth: { month: string; label: string; count: number }[];
  /** Sold units whose sale date was never captured (the Excel import carries none). */
  soldWithoutDate: number;
}

const monthLabel = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  const name = new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, number - 1, 1)),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

export const buildSummary = (units: InventoryUnit[]): InventorySummary => {
  const byBrand = new Map<string, BrandSummary>();
  const gauges = new Map<string, { gauge: string | number; count: number; models: Set<string> }>();
  const months = new Map<string, number>();
  let soldWithoutDate = 0;

  for (const unit of units) {
    const brand = sheetBrand(unit.brand);
    const entry = byBrand.get(brand) ?? { brand, available: 0, reserved: 0, sold: 0, total: 0 };
    entry.total += 1;
    if (unit.status === 'DISPONIBLE') entry.available += 1;
    else if (unit.status === 'APARTADA') entry.reserved += 1;
    else entry.sold += 1;
    byBrand.set(brand, entry);

    if (unit.status === 'DISPONIBLE') {
      const gauge = gaugeCell(unit.gauge);
      const key = String(gauge);
      const row = gauges.get(key) ?? { gauge, count: 0, models: new Set<string>() };
      row.count += 1;
      row.models.add(unit.model);
      gauges.set(key, row);
    }

    if (unit.status === 'VENDIDA') {
      if (unit.soldAt) {
        const month = unit.soldAt.slice(0, 7);
        months.set(month, (months.get(month) ?? 0) + 1);
      } else {
        soldWithoutDate += 1;
      }
    }
  }

  const count = (status: UnitStatus) => units.filter((unit) => unit.status === status).length;

  return {
    total: units.length,
    available: count('DISPONIBLE'),
    reserved: count('APARTADA'),
    sold: count('VENDIDA'),
    byBrand: [...byBrand.values()].sort((a, b) => compareBrands(a.brand, b.brand)),
    availableByGauge: [...gauges.values()]
      .sort(
        (a, b) =>
          parseFloat(String(a.gauge)) - parseFloat(String(b.gauge)) || String(a.gauge).localeCompare(String(b.gauge)),
      )
      .map(({ gauge, count: total, models }) => ({ gauge, count: total, models: [...models].sort() })),
    salesByMonth: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, label: monthLabel(month), count: total })),
    soldWithoutDate,
  };
};

const longDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDay = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "Generado el 2 de octubre de 2026" for the report header. */
export const generatedLabel = (now: Date) => `Generado el ${longDate.format(now)}`;

/** `dd/mm/aaaa` for a date built by this module (midnight UTC), or an empty string. */
export const formatDay = (date: Date | null) => (date ? shortDay.format(date) : '');

export const statusLabel = (status: UnitStatus) => statusLabels[status];

/** "INVENTARIO BODEGA MEXICO (2026-10-02).xlsx", with the local date: the UTC one is "tomorrow" in the afternoon in Mexico. */
export const exportFileName = (extension: 'xlsx' | 'pdf', now: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${REPORT_TITLE} (${day}).${extension}`;
};

/** Hands a generated file to the browser as a download. */
export const saveBlob = (blob: Blob, fileName: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};
