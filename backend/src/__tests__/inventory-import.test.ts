import { PrismaClient } from '@prisma/client';
import { runImport } from '../services/inventory-import';

const HEADER = ['MARCA', 'GALGA', 'MODELO', 'NO. SERIE', 'OBSERVACIONES'];

const rows = [
  ['INVENTARIO BODEGA MEXICO', 'INVENTARIO BODEGA MEXICO'],
  HEADER,
  ['Steiger', 5, 'Gemini', '9596/11'],
  ['Steiger', 10, 'Gemini', 7429, 'Vendida a Luis Leon'],
  ['Shima', 7, '183FF', 333],
];

const model = () =>
  Object.fromEntries(['findMany', 'findFirst', 'findUnique', 'create', 'update', 'delete', 'deleteMany'].map((m) => [m, jest.fn()]));

const makeDb = (existing: unknown[] = []) => {
  const tx = { brand: model(), machine: model(), inventoryUnit: model(), inventoryMovement: model() };
  tx.brand.findFirst.mockResolvedValue({ id: 'brand-1' });
  tx.machine.findMany.mockResolvedValue([]);
  tx.inventoryUnit.create.mockImplementation(async ({ data }: { data: { serialNumber: string } }) => ({
    id: `new-${data.serialNumber}`,
  }));

  const db = {
    inventoryUnit: model(),
    inventoryMovement: model(),
    $transaction: jest.fn((callback: (client: unknown) => unknown) => callback(tx)),
  };
  db.inventoryUnit.findMany.mockResolvedValue(existing);
  return { db: db as unknown as PrismaClient, raw: db, tx };
};

describe('runImport', () => {
  it('previews by default: reads the database but writes nothing', async () => {
    const { db, raw, tx } = makeDb();

    const plan = await runImport({ rows, apply: false, db });

    expect(plan.create).toHaveLength(3);
    expect(raw.$transaction).not.toHaveBeenCalled();
    expect(tx.inventoryUnit.create).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('prints what it found, including the units missing from the file', async () => {
    const { db } = makeDb([
      { id: 'old', brand: 'Steiger', serialNumber: '0001', model: 'Vesta', gauge: '7', status: 'DISPONIBLE', notes: null },
    ]);
    const log: string[] = [];

    await runImport({ rows, apply: false, db, log: (line) => log.push(line) });

    const output = log.join('\n');
    expect(output).toContain('File: 3 units (2 available, 0 reserved, 1 sold)');
    expect(output).toContain('New units: 3');
    expect(output).toContain('+ Shima Seiki 183FF gauge 7 serial 333 [DISPONIBLE]');
    expect(output).toContain('? Steiger Vesta serial 0001 [DISPONIBLE]');
  });

  it('with apply, creates every new unit with an IMPORT movement that has no user', async () => {
    const { db, tx } = makeDb();

    await runImport({ rows, apply: true, db });

    expect(tx.inventoryUnit.create).toHaveBeenCalledTimes(3);
    const sold = tx.inventoryUnit.create.mock.calls.find(([arg]) => arg.data.serialNumber === '7429')![0].data;
    expect(sold).toMatchObject({
      brand: 'Steiger',
      brandId: 'brand-1',
      gauge: '10',
      status: 'VENDIDA',
      notes: 'Vendida a Luis Leon',
    });
    expect(sold).not.toHaveProperty('soldAt');

    expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(3);
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: { unitId: 'new-7429', userId: null, action: 'IMPORT', toStatus: 'VENDIDA' },
    });
  });

  it('updates a changed unit, logs before and after, and clears soldAt when it leaves VENDIDA', async () => {
    const { db, tx } = makeDb([
      { id: 'u-9596', brand: 'Steiger', serialNumber: '9596/11', model: 'Gemini', gauge: '5', status: 'VENDIDA', notes: 'Vendida a X' },
    ]);

    await runImport({ rows, apply: true, db });

    expect(tx.inventoryUnit.update).toHaveBeenCalledTimes(1);
    expect(tx.inventoryUnit.update.mock.calls[0][0]).toEqual({
      where: { id: 'u-9596' },
      data: { model: 'Gemini', gauge: '5', status: 'DISPONIBLE', notes: null, soldAt: null },
    });
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: {
        unitId: 'u-9596',
        userId: null,
        action: 'IMPORT',
        fromStatus: 'VENDIDA',
        toStatus: 'DISPONIBLE',
        changes: { status: ['VENDIDA', 'DISPONIBLE'], notes: ['Vendida a X', null] },
      },
    });
  });

  it('is idempotent: a second run over the same data writes nothing', async () => {
    const existing = [
      { id: 'a', brand: 'Steiger', serialNumber: '9596/11', model: 'Gemini', gauge: '5', status: 'DISPONIBLE', notes: null },
      { id: 'b', brand: 'Steiger', serialNumber: '7429', model: 'Gemini', gauge: '10', status: 'VENDIDA', notes: 'Vendida a Luis Leon' },
      { id: 'c', brand: 'Shima Seiki', serialNumber: '333', model: '183FF', gauge: '7', status: 'DISPONIBLE', notes: null },
    ];
    const { db, raw, tx } = makeDb(existing);

    const plan = await runImport({ rows, apply: true, db });

    expect(plan.unchanged).toBe(3);
    expect(raw.$transaction).not.toHaveBeenCalled();
    expect(tx.inventoryUnit.create).not.toHaveBeenCalled();
    expect(tx.inventoryUnit.update).not.toHaveBeenCalled();
  });

  it('never deletes: units missing from the file are kept even with apply', async () => {
    const { db, raw, tx } = makeDb([
      { id: 'old', brand: 'Steiger', serialNumber: '0001', model: 'Vesta', gauge: '7', status: 'DISPONIBLE', notes: null },
    ]);

    const plan = await runImport({ rows, apply: true, db });

    expect(plan.missing).toHaveLength(1);
    for (const client of [raw, tx]) {
      expect(client.inventoryUnit.delete).not.toHaveBeenCalled();
      expect(client.inventoryUnit.deleteMany).not.toHaveBeenCalled();
    }
  });

  it('fails before touching the database when the file has no recognizable header', async () => {
    const { db, raw } = makeDb();

    await expect(runImport({ rows: [['a', 'b'], [1, 2]], apply: true, db })).rejects.toThrow('Header row not found');

    expect(raw.inventoryUnit.findMany).not.toHaveBeenCalled();
  });
});
