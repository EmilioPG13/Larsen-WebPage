import { UnitStatus } from '@prisma/client';
import {
  ExistingUnit,
  normalizeBrand,
  parseInventoryRows,
  planImport,
  soldAtFor,
  statusFromObservations,
} from '../services/inventory';

const HEADER = ['MARCA', 'GALGA', 'MODELO', 'NO. SERIE', 'OBSERVACIONES'];

describe('normalizeBrand', () => {
  it('maps the spreadsheet spellings to the names shown on the site', () => {
    expect(normalizeBrand('Shima')).toBe('Shima Seiki');
    expect(normalizeBrand('  shima  seiki ')).toBe('Shima Seiki');
    expect(normalizeBrand('STEIGER')).toBe('Steiger');
  });

  it('leaves an unknown brand as written (trimmed)', () => {
    expect(normalizeBrand(' Protti ')).toBe('Protti');
  });
});

describe('normalizeBrand with names that exist on Object.prototype', () => {
  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])('keeps %s as plain text', (name) => {
    expect(normalizeBrand(name)).toBe(name);
  });
});

describe('statusFromObservations', () => {
  it.each([
    ['Vendida a Luis Leon', UnitStatus.VENDIDA],
    ['VENDIDA', UnitStatus.VENDIDA],
    ['Apartada por cliente', UnitStatus.APARTADA],
    ['revisar motor', UnitStatus.DISPONIBLE],
    ['', UnitStatus.DISPONIBLE],
  ])('%j -> %s', (text, expected) => {
    expect(statusFromObservations(text)).toBe(expected);
  });
});

describe('parseInventoryRows', () => {
  it('finds the header below a title row and reads numeric and text serials as strings', () => {
    const { units, skipped } = parseInventoryRows([
      ['INVENTARIO BODEGA MEXICO', 'INVENTARIO BODEGA MEXICO'],
      HEADER,
      ['Steiger', 7, 'Vesta 2+2.240', 392],
      ['Steiger', 3, 'Vesta 2E3', '6212/05'],
      ['Shima', 5, '234CS', 50576],
    ]);

    expect(skipped).toEqual([]);
    expect(units).toEqual([
      { brand: 'Steiger', gauge: '7', model: 'Vesta 2+2.240', serialNumber: '392', status: 'DISPONIBLE', notes: null },
      { brand: 'Steiger', gauge: '3', model: 'Vesta 2E3', serialNumber: '6212/05', status: 'DISPONIBLE', notes: null },
      { brand: 'Shima Seiki', gauge: '5', model: '234CS', serialNumber: '50576', status: 'DISPONIBLE', notes: null },
    ]);
  });

  it('finds columns by header text, whatever their order', () => {
    const { units } = parseInventoryRows([
      ['OBSERVACIONES', 'NO. SERIE', 'MODELO', 'GALGA', 'MARCA'],
      ['Vendida a Juan', '6644/02', 'Vesta 130E', 14, 'Steiger'],
    ]);

    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({
      brand: 'Steiger',
      gauge: '14',
      model: 'Vesta 130E',
      serialNumber: '6644/02',
      status: 'VENDIDA',
      notes: 'Vendida a Juan',
    });
  });

  it('tolerates accents, case and punctuation in headers', () => {
    const { units } = parseInventoryRows([
      ['Marca', 'Galga', 'Modelo', 'No Serie', 'Observaciónes'],
      ['Shima', 7, '183FF', 333, 'Apartada'],
    ]);

    expect(units[0]).toMatchObject({ serialNumber: '333', status: 'APARTADA', notes: 'Apartada' });
  });

  it('keeps the original text of OBSERVACIONES in notes for every status', () => {
    const { units } = parseInventoryRows([
      HEADER,
      ['Steiger', 10, 'Gemini', 7429, 'Vendida a Luis Leon'],
      ['Steiger', 5, 'Gemini', 9596, 'en revisión'],
    ]);

    expect(units.map((u) => [u.status, u.notes])).toEqual([
      ['VENDIDA', 'Vendida a Luis Leon'],
      ['DISPONIBLE', 'en revisión'],
    ]);
  });

  it('skips blank rows silently and reports incomplete or duplicated ones', () => {
    const { units, skipped } = parseInventoryRows([
      HEADER,
      ['Steiger', 5, 'Gemini', 9596],
      [null, null, null, null, null],
      ['Steiger', 5, 'Gemini', ''],
      ['Steiger', 5, 'Gemini', 9596],
    ]);

    expect(units).toHaveLength(1);
    expect(skipped).toEqual([
      { row: 4, reason: 'missing brand, gauge, model or serial number' },
      { row: 5, reason: 'duplicate serial number 9596 for Steiger' },
    ]);
  });

  it('treats the same serial under two brands as two units', () => {
    const { units } = parseInventoryRows([
      HEADER,
      ['Steiger', 5, 'Gemini', 298],
      ['Shima', 12, '183FF', 298],
    ]);

    expect(units).toHaveLength(2);
  });

  it.each(['N° SERIE', 'Nº SERIE', 'Número de serie', 'NUMERO DE SERIE', 'SERIE'])(
    'recognizes %j as the serial number header',
    (header) => {
      const { units } = parseInventoryRows([
        ['MARCA', 'GALGA', 'MODELO', header],
        ['Steiger', 5, 'Gemini', 9596],
      ]);

      expect(units[0].serialNumber).toBe('9596');
    }
  );

  it('throws a clear error when there is no header row', () => {
    expect(() => parseInventoryRows([['a', 'b'], [1, 2]])).toThrow('Header row not found');
  });

  it('throws when a required column is missing', () => {
    expect(() => parseInventoryRows([['MARCA', 'NO. SERIE', 'MODELO'], ['Steiger', 1, 'X']])).toThrow(
      'Missing required columns: GALGA'
    );
  });

  it('reads exceljs rich text and formula cells as plain text', () => {
    const { units } = parseInventoryRows([
      HEADER,
      ['Steiger', 5, { richText: [{ text: 'Vesta ' }, { text: '3.130' }] }, { result: '4792/97' }],
    ]);

    expect(units[0]).toMatchObject({ model: 'Vesta 3.130', serialNumber: '4792/97' });
  });
});

describe('planImport', () => {
  const parsed = (serialNumber: string, extra: Partial<Parameters<typeof planImport>[0][number]> = {}) => ({
    brand: 'Steiger',
    gauge: '5',
    model: 'Gemini',
    serialNumber,
    status: UnitStatus.DISPONIBLE,
    notes: null,
    ...extra,
  });

  const existing = (serialNumber: string, extra: Partial<ExistingUnit> = {}): ExistingUnit => ({
    id: `id-${serialNumber}`,
    brand: 'Steiger',
    gauge: '5',
    model: 'Gemini',
    serialNumber,
    status: UnitStatus.DISPONIBLE,
    notes: null,
    ...extra,
  });

  it('puts every unit in create when the database is empty', () => {
    const plan = planImport([parsed('1'), parsed('2')], []);

    expect(plan.create).toHaveLength(2);
    expect(plan.update).toHaveLength(0);
    expect(plan.missing).toHaveLength(0);
  });

  it('is idempotent: importing the same data twice changes nothing', () => {
    const plan = planImport([parsed('1'), parsed('2')], [existing('1'), existing('2')]);

    expect(plan).toEqual({ create: [], update: [], unchanged: 2, missing: [] });
  });

  it('reports the before and after of every changed field', () => {
    const plan = planImport(
      [parsed('1', { status: UnitStatus.VENDIDA, notes: 'Vendida a Luis' })],
      [existing('1')]
    );

    expect(plan.update).toHaveLength(1);
    expect(plan.update[0].id).toBe('id-1');
    expect(plan.update[0].changes).toEqual({
      status: ['DISPONIBLE', 'VENDIDA'],
      notes: [null, 'Vendida a Luis'],
    });
  });

  it('reports units missing from the file but never plans to delete them', () => {
    const plan = planImport([parsed('1')], [existing('1'), existing('9')]);

    expect(plan.missing.map((u) => u.serialNumber)).toEqual(['9']);
    expect(plan.update).toHaveLength(0);
  });

  it('matches by brand and serial, so the same serial under another brand is a new unit', () => {
    const plan = planImport([parsed('298', { brand: 'Shima Seiki' })], [existing('298')]);

    expect(plan.create).toHaveLength(1);
    expect(plan.missing).toHaveLength(1);
  });
});

describe('soldAtFor', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  const earlier = new Date('2026-09-01T12:00:00Z');
  const requested = new Date('2026-09-15T12:00:00Z');

  it('stamps today when a unit becomes VENDIDA with no date', () => {
    expect(soldAtFor(UnitStatus.VENDIDA, null, undefined, now)).toEqual(now);
  });

  it('keeps the existing sale date when none is requested', () => {
    expect(soldAtFor(UnitStatus.VENDIDA, earlier, undefined, now)).toEqual(earlier);
  });

  it('uses the requested date over the existing one', () => {
    expect(soldAtFor(UnitStatus.VENDIDA, earlier, requested, now)).toEqual(requested);
  });

  it('clears the sale date when the unit leaves VENDIDA', () => {
    expect(soldAtFor(UnitStatus.DISPONIBLE, earlier, requested, now)).toBeNull();
    expect(soldAtFor(UnitStatus.APARTADA, earlier, undefined, now)).toBeNull();
  });
});
