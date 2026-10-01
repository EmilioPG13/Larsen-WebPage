import { PrismaClient, UnitStatus } from '@prisma/client';

/**
 * Pure helpers for the inventory: brand normalization, the spreadsheet row
 * parser and the import planner. They know nothing about Prisma queries or
 * exceljs so both the import script and the tests can use them directly.
 */

// How the company writes a brand in its spreadsheet -> the name shown on the site.
// A Map, not an object literal: a lookup like "constructor" must not hit Object.prototype.
const BRAND_ALIASES = new Map([
  ['steiger', 'Steiger'],
  ['shima', 'Shima Seiki'],
  ['shima seiki', 'Shima Seiki'],
]);

export const normalizeBrand = (raw: string): string => {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  return BRAND_ALIASES.get(trimmed.toLowerCase()) ?? trimmed;
};

/** Plain-text cell value: numbers become strings (Excel stores serial 392 as a number). */
const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // exceljs rich text / formula / hyperlink cells
    const v = value as { richText?: { text: string }[]; text?: string; result?: unknown };
    if (Array.isArray(v.richText)) return v.richText.map((part) => part.text).join('').trim();
    if (typeof v.text === 'string') return v.text.trim();
    if (v.result !== undefined) return cellText(v.result);
    return '';
  }
  return String(value).trim();
};

/** The status a free-text OBSERVACIONES cell stands for ("Vendida a Luis Leon" -> VENDIDA). */
export const statusFromObservations = (observations: string): UnitStatus => {
  if (/vendida/i.test(observations)) return UnitStatus.VENDIDA;
  if (/apartad/i.test(observations)) return UnitStatus.APARTADA;
  return UnitStatus.DISPONIBLE;
};

export interface ParsedUnit {
  brand: string;
  gauge: string;
  model: string;
  serialNumber: string;
  status: UnitStatus;
  notes: string | null;
}

export interface ParsedSheet {
  units: ParsedUnit[];
  /** Rows that were skipped, with the 1-based row number and why. */
  skipped: { row: number; reason: string }[];
}

const normalizeHeader = (value: unknown): string =>
  cellText(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Z0-9]/g, '');

// Accepted spellings of each header after normalization (accents, case and
// punctuation removed), so "NO. SERIE", "N° SERIE" and "Número de serie" all match.
const HEADERS = {
  brand: ['MARCA'],
  gauge: ['GALGA'],
  model: ['MODELO'],
  serialNumber: ['NOSERIE', 'NSERIE', 'NUMEROSERIE', 'NUMERODESERIE', 'SERIE'],
  notes: ['OBSERVACIONES', 'OBSERVACION'],
} as const;

type Column = keyof typeof HEADERS;

const isHeader = (name: string, column: Column): boolean => (HEADERS[column] as readonly string[]).includes(name);

/**
 * Reads the rows of the company's inventory sheet. Columns are found by their
 * header text, not by position, and the header row is the first row that has
 * both MARCA and NO. SERIE, so a title row above it or a different column
 * order does not matter.
 *
 * `rows` is a plain matrix: rows[0] is the first sheet row, cells are 0-based.
 */
export const parseInventoryRows = (rows: unknown[][]): ParsedSheet => {
  const headerIndex = rows.findIndex((row) => {
    const names = row.map(normalizeHeader);
    return names.some((name) => isHeader(name, 'brand')) && names.some((name) => isHeader(name, 'serialNumber'));
  });

  if (headerIndex === -1) {
    throw new Error('Header row not found: expected the columns MARCA and NO. SERIE');
  }

  const names = rows[headerIndex].map(normalizeHeader);
  const col = {} as Record<Column, number>;
  (Object.keys(HEADERS) as Column[]).forEach((key) => {
    col[key] = names.findIndex((name) => isHeader(name, key));
  });

  const missing = (['gauge', 'model'] as Column[]).filter((key) => col[key] === -1);
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.map((key) => HEADERS[key][0]).join(', ')}`);
  }

  const read = (row: unknown[], key: Column): string => (col[key] === -1 ? '' : cellText(row[col[key]]));

  const units: ParsedUnit[] = [];
  const skipped: ParsedSheet['skipped'] = [];
  const seen = new Set<string>();

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = headerIndex + offset + 2;
    if (row.every((cell) => cellText(cell) === '')) return; // blank row

    const brandRaw = read(row, 'brand');
    const model = read(row, 'model');
    const serialNumber = read(row, 'serialNumber');
    const gauge = read(row, 'gauge');

    if (!brandRaw || !model || !serialNumber || !gauge) {
      skipped.push({ row: rowNumber, reason: 'missing brand, gauge, model or serial number' });
      return;
    }

    const brand = normalizeBrand(brandRaw);
    const key = `${brand}|${serialNumber}`;
    if (seen.has(key)) {
      skipped.push({ row: rowNumber, reason: `duplicate serial number ${serialNumber} for ${brand}` });
      return;
    }
    seen.add(key);

    const observations = read(row, 'notes');
    units.push({
      brand,
      gauge,
      model,
      serialNumber,
      status: statusFromObservations(observations),
      notes: observations || null,
    });
  });

  return { units, skipped };
};

/** What the database holds for a unit, as far as the importer compares it. */
export interface ExistingUnit {
  id: string;
  brand: string;
  serialNumber: string;
  model: string;
  gauge: string;
  status: UnitStatus;
  notes: string | null;
}

export type FieldChanges = Record<string, [unknown, unknown]>;

export interface ImportPlan {
  create: ParsedUnit[];
  update: { id: string; unit: ParsedUnit; changes: FieldChanges }[];
  unchanged: number;
  /** In the database but not in the file. Reported, never deleted. */
  missing: ExistingUnit[];
}

const COMPARED_FIELDS = ['model', 'gauge', 'status', 'notes'] as const;

export const planImport = (parsed: ParsedUnit[], existing: ExistingUnit[]): ImportPlan => {
  const byKey = new Map(existing.map((unit) => [`${unit.brand}|${unit.serialNumber}`, unit]));
  const inFile = new Set(parsed.map((unit) => `${unit.brand}|${unit.serialNumber}`));

  const plan: ImportPlan = { create: [], update: [], unchanged: 0, missing: [] };

  for (const unit of parsed) {
    const current = byKey.get(`${unit.brand}|${unit.serialNumber}`);
    if (!current) {
      plan.create.push(unit);
      continue;
    }

    const changes: FieldChanges = {};
    for (const field of COMPARED_FIELDS) {
      if (current[field] !== unit[field]) changes[field] = [current[field], unit[field]];
    }

    if (Object.keys(changes).length === 0) plan.unchanged += 1;
    else plan.update.push({ id: current.id, unit, changes });
  }

  plan.missing = existing.filter((unit) => !inFile.has(`${unit.brand}|${unit.serialNumber}`));
  return plan;
};

/**
 * soldAt rule shared by every write that changes a status: entering VENDIDA
 * stamps the sale date (the one given, else the existing one, else now);
 * leaving VENDIDA clears it.
 */
export const soldAtFor = (
  toStatus: UnitStatus,
  current: Date | null,
  requested: Date | null | undefined,
  now: Date = new Date()
): Date | null => {
  if (toStatus !== UnitStatus.VENDIDA) return null;
  return requested ?? current ?? now;
};

/** The part of the Prisma client the lookups below need (the client or a transaction). */
type LookupClient = Pick<PrismaClient, 'brand' | 'machine'>;

/** Links a normalized brand name to a row of the brands table ("Steiger" -> "Steiger ZAMARK"). */
export const resolveBrandId = async (db: LookupClient, brand: string): Promise<string | null> => {
  const found = await db.brand.findFirst({
    where: { name: { contains: brand, mode: 'insensitive' } },
    select: { id: true },
  });
  return found?.id ?? null;
};

/** Finds the spec sheet of a model by name and brand, when the catalog has one. */
export const findMachineId = async (
  db: LookupClient,
  brand: string,
  model: string
): Promise<string | null> => {
  const candidates = await db.machine.findMany({
    where: { name: { equals: model, mode: 'insensitive' } },
    select: { id: true, brand: true },
  });
  return candidates.find((machine) => normalizeBrand(machine.brand) === brand)?.id ?? null;
};
