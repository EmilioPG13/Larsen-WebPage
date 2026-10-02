import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prismaClient from '../config/database';

jest.mock('../config/env', () => ({
  __esModule: true,
  default: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  },
}));

jest.mock('../config/database', () => {
  const model = () =>
    Object.fromEntries(['findMany', 'findUnique', 'findFirst', 'create', 'update', 'delete', 'groupBy'].map((m) => [m, jest.fn()]));
  // `tx` is a separate set of mocks: whatever the controller writes through the
  // transaction callback lands here, and anything written outside it lands on `db`.
  const tx = { brand: model(), machine: model(), inventoryUnit: model(), inventoryMovement: model() };
  const db: Record<string, unknown> = {
    user: model(),
    inventoryUnit: model(),
    inventoryMovement: model(),
    $transaction: jest.fn((callback: (client: unknown) => unknown) => callback(tx)),
    __tx: tx,
  };
  return { __esModule: true, default: db };
});

type Mocks = Record<string, Record<string, jest.Mock>>;
const db = prismaClient as unknown as Mocks & { $transaction: jest.Mock; __tx: Mocks };
const tx = db.__tx;

const auth = { Authorization: `Bearer ${jwt.sign({ userId: 'u1', email: 'u1@example.com' }, 'test-secret')}` };

const asUser = (role: 'ADMIN' | 'INVENTARIO', active = true) =>
  db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u1@example.com', role, active });

const unit = (overrides: Record<string, unknown> = {}) => ({
  id: 'unit-1',
  brand: 'Steiger',
  model: 'Gemini',
  gauge: '5',
  serialNumber: '9596/11',
  status: 'DISPONIBLE',
  modality: 'EN_BODEGA',
  soldAt: null,
  notes: null,
  ...overrides,
});

const newUnit = { brand: 'Steiger', model: 'Gemini', gauge: 5, serialNumber: '9596/11' };

beforeEach(() => {
  jest.clearAllMocks();
  tx.brand.findFirst.mockResolvedValue({ id: 'brand-1' });
  tx.machine.findMany.mockResolvedValue([]);
  tx.machine.findUnique.mockResolvedValue({ id: 'vesta-multi' });
  tx.inventoryMovement.create.mockResolvedValue({});
});

describe('inventory routes: permissions', () => {
  it('rejects requests without a token with 401', async () => {
    await request(app).get('/api/inventory').expect(401);
    await request(app).post('/api/inventory').send({}).expect(401);
    await request(app).patch('/api/inventory/unit-1/status').send({}).expect(401);
    await request(app).delete('/api/inventory/unit-1').expect(401);
  });

  it('lets an INVENTARIO user list, create, edit and change the status', async () => {
    asUser('INVENTARIO');
    db.inventoryUnit.findMany.mockResolvedValue([]);
    tx.inventoryUnit.create.mockResolvedValue(unit());
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());
    tx.inventoryUnit.update.mockResolvedValue(unit({ status: 'APARTADA' }));

    await request(app).get('/api/inventory').set(auth).expect(200);
    await request(app).post('/api/inventory').set(auth).send(newUnit).expect(201);
    await request(app).put('/api/inventory/unit-1').set(auth).send({ notes: 'revisar' }).expect(200);
    await request(app).patch('/api/inventory/unit-1/status').set(auth).send({ status: 'APARTADA' }).expect(200);
  });

  it('gets 403 on DELETE for an INVENTARIO user and the unit is not touched', async () => {
    asUser('INVENTARIO');

    await request(app).delete('/api/inventory/unit-1').set(auth).expect(403);

    expect(db.inventoryUnit.delete).not.toHaveBeenCalled();
  });

  it('lets an ADMIN delete a unit and answers 404 when it does not exist', async () => {
    asUser('ADMIN');
    db.inventoryUnit.delete.mockResolvedValueOnce({}).mockRejectedValueOnce({ code: 'P2025' });

    await request(app).delete('/api/inventory/unit-1').set(auth).expect(200);
    await request(app).delete('/api/inventory/missing').set(auth).expect(404);
  });

  it('rejects a deactivated user with 403', async () => {
    asUser('INVENTARIO', false);

    await request(app).get('/api/inventory').set(auth).expect(403);
  });
});

describe('GET /api/inventory', () => {
  beforeEach(() => asUser('INVENTARIO'));

  it('filters by status, brand and search, and includes the last movement', async () => {
    db.inventoryUnit.findMany.mockResolvedValue([]);

    await request(app).get('/api/inventory?status=VENDIDA&brand=Shima&q=333').set(auth).expect(200);

    const args = db.inventoryUnit.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      status: 'VENDIDA',
      brand: 'Shima Seiki',
      OR: [
        { serialNumber: { contains: '333', mode: 'insensitive' } },
        { model: { contains: '333', mode: 'insensitive' } },
      ],
    });
    expect(args.include.movements.take).toBe(1);
  });

  it('treats an empty status as "all"', async () => {
    db.inventoryUnit.findMany.mockResolvedValue([]);

    await request(app).get('/api/inventory?status=').set(auth).expect(200);

    expect(db.inventoryUnit.findMany.mock.calls[0][0].where).toEqual({});
  });

  it('rejects an invalid status with 400', async () => {
    await request(app).get('/api/inventory?status=ROTA').set(auth).expect(400);

    expect(db.inventoryUnit.findMany).not.toHaveBeenCalled();
  });

  it('does not break on a brand that is also an Object.prototype property', async () => {
    db.inventoryUnit.findMany.mockResolvedValue([]);

    await request(app).get('/api/inventory?brand=constructor').set(auth).expect(200);

    expect(db.inventoryUnit.findMany.mock.calls[0][0].where).toEqual({ brand: 'constructor' });
  });
});

describe('POST /api/inventory', () => {
  beforeEach(() => asUser('INVENTARIO'));

  it('writes the unit and its CREATE movement through the transaction, attributed to the user', async () => {
    tx.inventoryUnit.create.mockResolvedValue(unit({ id: 'new-1' }));

    await request(app)
      .post('/api/inventory')
      .set(auth)
      .send({ brand: 'shima', model: ' 183FF ', gauge: 7, serialNumber: 333 })
      .expect(201);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.inventoryUnit.create.mock.calls[0][0].data).toMatchObject({
      brand: 'Shima Seiki',
      brandId: 'brand-1',
      model: '183FF',
      gauge: '7',
      serialNumber: '333',
      status: 'DISPONIBLE',
      modality: 'EN_BODEGA',
      soldAt: null,
    });
    expect(tx.inventoryMovement.create).toHaveBeenCalledWith({
      data: { unitId: 'new-1', userId: 'u1', action: 'CREATE', toStatus: 'DISPONIBLE' },
    });
    // Nothing is written outside the transaction.
    expect(db.inventoryUnit.create).not.toHaveBeenCalled();
    expect(db.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('stamps the sale date when a unit is created already sold', async () => {
    tx.inventoryUnit.create.mockResolvedValue(unit({ status: 'VENDIDA' }));

    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, status: 'VENDIDA' }).expect(201);

    expect(tx.inventoryUnit.create.mock.calls[0][0].data.soldAt).toBeInstanceOf(Date);
  });

  it('links the spec sheet when the model matches one of the same brand', async () => {
    tx.machine.findMany.mockResolvedValue([
      { id: 'other', brand: 'Shima Seiki' },
      { id: 'vesta-multi', brand: 'Steiger' },
    ]);
    tx.inventoryUnit.create.mockResolvedValue(unit());

    await request(app)
      .post('/api/inventory')
      .set(auth)
      .send({ brand: 'Steiger', model: 'Vesta Multi', gauge: 6, serialNumber: '6689/02' })
      .expect(201);

    expect(tx.inventoryUnit.create.mock.calls[0][0].data.machineId).toBe('vesta-multi');
  });

  it('accepts an explicit machineId that exists and rejects one that does not', async () => {
    tx.inventoryUnit.create.mockResolvedValue(unit());

    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, machineId: 'vesta-multi' }).expect(201);
    expect(tx.inventoryUnit.create.mock.calls[0][0].data.machineId).toBe('vesta-multi');

    tx.machine.findUnique.mockResolvedValue(null);
    tx.inventoryUnit.create.mockClear();
    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, machineId: 'ghost' }).expect(400);
    expect(tx.inventoryUnit.create).not.toHaveBeenCalled();
  });

  it.each([
    [{ model: 'Gemini', gauge: 5, serialNumber: '1' }],
    [{ brand: 'Steiger', gauge: 5, serialNumber: '1' }],
    [{ brand: 'Steiger', model: 'Gemini', serialNumber: '1' }],
    [{ brand: 'Steiger', model: 'Gemini', gauge: 5, serialNumber: '   ' }],
  ])('rejects a body missing a required field with 400: %j', async (body) => {
    await request(app).post('/api/inventory').set(auth).send(body).expect(400);

    expect(tx.inventoryUnit.create).not.toHaveBeenCalled();
  });

  it.each([
    ['an object', { serialNumber: { a: 1 } }],
    ['an array', { model: ['Gemini'] }],
    ['a boolean', { gauge: true }],
    ['an object in notes', { notes: { a: 1 } }],
    ['an object as machineId', { machineId: { a: 1 } }],
  ])('rejects %s instead of storing "[object Object]"', async (_label, override) => {
    await request(app)
      .post('/api/inventory')
      .set(auth)
      .send({ ...newUnit, ...override })
      .expect(400);

    expect(tx.inventoryUnit.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid status, modality or date with 400', async () => {
    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, status: 'ROTA' }).expect(400);
    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, modality: 'X' }).expect(400);
    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, receivedAt: 'ayer' }).expect(400);
    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, receivedAt: 2026 }).expect(400);
  });

  it('keeps an unknown brand such as "constructor" as plain text instead of failing', async () => {
    tx.inventoryUnit.create.mockResolvedValue(unit());

    await request(app).post('/api/inventory').set(auth).send({ ...newUnit, brand: 'constructor' }).expect(201);

    expect(tx.inventoryUnit.create.mock.calls[0][0].data.brand).toBe('constructor');
  });

  it('answers 409 for a duplicate brand and serial number', async () => {
    tx.inventoryUnit.create.mockRejectedValue({ code: 'P2002', meta: { target: ['brand', 'serialNumber'] } });

    const res = await request(app).post('/api/inventory').set(auth).send(newUnit).expect(409);

    expect(res.body.error).toMatch(/brand and serial number already exists/);
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/inventory/:id/status', () => {
  beforeEach(() => asUser('INVENTARIO'));

  it('marks a unit as sold: sets soldAt to today and records who did it', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());
    tx.inventoryUnit.update.mockResolvedValue(unit({ status: 'VENDIDA' }));

    await request(app).patch('/api/inventory/unit-1/status').set(auth).send({ status: 'VENDIDA' }).expect(200);

    const update = tx.inventoryUnit.update.mock.calls[0][0];
    expect(update.data.status).toBe('VENDIDA');
    expect(update.data.soldAt).toBeInstanceOf(Date);

    expect(tx.inventoryMovement.create.mock.calls[0][0].data).toMatchObject({
      unitId: 'unit-1',
      userId: 'u1',
      action: 'STATUS',
      fromStatus: 'DISPONIBLE',
      toStatus: 'VENDIDA',
    });
    expect(db.inventoryUnit.findUnique).not.toHaveBeenCalledWith({ where: { id: 'unit-1' } });
  });

  it('uses the sale date sent by the client', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());
    tx.inventoryUnit.update.mockResolvedValue(unit({ status: 'VENDIDA' }));

    await request(app)
      .patch('/api/inventory/unit-1/status')
      .set(auth)
      .send({ status: 'VENDIDA', soldAt: '2026-09-20' })
      .expect(200);

    expect(tx.inventoryUnit.update.mock.calls[0][0].data.soldAt).toEqual(new Date('2026-09-20'));
  });

  it('clears the sale date when a unit leaves VENDIDA', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit({ status: 'VENDIDA', soldAt: new Date('2026-09-20') }));
    tx.inventoryUnit.update.mockResolvedValue(unit());

    await request(app).patch('/api/inventory/unit-1/status').set(auth).send({ status: 'DISPONIBLE' }).expect(200);

    expect(tx.inventoryUnit.update.mock.calls[0][0].data).toEqual({ status: 'DISPONIBLE', soldAt: null });
    expect(tx.inventoryMovement.create.mock.calls[0][0].data).toMatchObject({
      fromStatus: 'VENDIDA',
      toStatus: 'DISPONIBLE',
    });
  });

  it('does nothing and records nothing when the status is already that one', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit({ status: 'APARTADA' }));

    await request(app).patch('/api/inventory/unit-1/status').set(auth).send({ status: 'APARTADA' }).expect(200);

    expect(tx.inventoryUnit.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('answers 400 for an invalid status or date and 404 for an unknown unit', async () => {
    await request(app).patch('/api/inventory/unit-1/status').set(auth).send({ status: 'ROTA' }).expect(400);
    await request(app)
      .patch('/api/inventory/unit-1/status')
      .set(auth)
      .send({ status: 'VENDIDA', soldAt: 'mañana' })
      .expect(400);

    tx.inventoryUnit.findUnique.mockResolvedValue(null);
    await request(app).patch('/api/inventory/ghost/status').set(auth).send({ status: 'VENDIDA' }).expect(404);
    expect(tx.inventoryUnit.update).not.toHaveBeenCalled();
  });

  it('does not log a movement when the update itself fails', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());
    tx.inventoryUnit.update.mockRejectedValue({ code: 'P2025' });

    await request(app).patch('/api/inventory/unit-1/status').set(auth).send({ status: 'VENDIDA' }).expect(404);

    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/inventory/:id', () => {
  beforeEach(() => asUser('INVENTARIO'));

  it('updates only what changed and logs before and after', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit({ notes: 'viejo' }));
    tx.inventoryUnit.update.mockResolvedValue(unit({ notes: 'nuevo' }));

    await request(app).put('/api/inventory/unit-1').set(auth).send({ notes: 'nuevo', model: 'Gemini' }).expect(200);

    expect(tx.inventoryUnit.update.mock.calls[0][0].data).toEqual({ model: 'Gemini', notes: 'nuevo' });
    expect(tx.inventoryMovement.create.mock.calls[0][0].data).toMatchObject({
      unitId: 'unit-1',
      userId: 'u1',
      action: 'UPDATE',
      changes: { notes: ['viejo', 'nuevo'] },
    });
  });

  it('writes nothing when no field actually changes', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());

    await request(app).put('/api/inventory/unit-1').set(auth).send({ model: 'Gemini', gauge: '5' }).expect(200);

    expect(tx.inventoryUnit.update).not.toHaveBeenCalled();
    expect(tx.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('ignores a status sent here: status only changes through PATCH', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());

    await request(app).put('/api/inventory/unit-1').set(auth).send({ status: 'VENDIDA' }).expect(200);

    expect(tx.inventoryUnit.update).not.toHaveBeenCalled();
  });

  it('only accepts a sale date on a sold unit, and never lets a sold unit lose it', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());
    await request(app).put('/api/inventory/unit-1').set(auth).send({ soldAt: '2026-09-20' }).expect(400);
    // A form that always sends the whole object may send soldAt: null for an unsold unit.
    await request(app).put('/api/inventory/unit-1').set(auth).send({ soldAt: null }).expect(200);

    tx.inventoryUnit.findUnique.mockResolvedValue(unit({ status: 'VENDIDA', soldAt: new Date('2026-09-01') }));
    await request(app).put('/api/inventory/unit-1').set(auth).send({ soldAt: null }).expect(400);
    await request(app).put('/api/inventory/unit-1').set(auth).send({ soldAt: '' }).expect(400);

    tx.inventoryUnit.update.mockResolvedValue(unit({ status: 'VENDIDA' }));
    await request(app).put('/api/inventory/unit-1').set(auth).send({ soldAt: '2026-09-20' }).expect(200);
    expect(tx.inventoryUnit.update.mock.calls[0][0].data.soldAt).toEqual(new Date('2026-09-20'));
  });

  it('validates machineId: it must exist and be text', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());
    tx.inventoryUnit.update.mockResolvedValue(unit({ machineId: 'vesta-multi' }));

    await request(app).put('/api/inventory/unit-1').set(auth).send({ machineId: 'vesta-multi' }).expect(200);

    tx.machine.findUnique.mockResolvedValue(null);
    await request(app).put('/api/inventory/unit-1').set(auth).send({ machineId: 'ghost' }).expect(400);
    await request(app).put('/api/inventory/unit-1').set(auth).send({ machineId: { a: 1 } }).expect(400);
  });

  it('rejects emptying a required field and a non-text value with 400', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());

    await request(app).put('/api/inventory/unit-1').set(auth).send({ model: '  ' }).expect(400);
    await request(app).put('/api/inventory/unit-1').set(auth).send({ serialNumber: { a: 1 } }).expect(400);
    await request(app).put('/api/inventory/unit-1').set(auth).send({ brand: '' }).expect(400);
    expect(tx.inventoryUnit.update).not.toHaveBeenCalled();
  });

  it('answers 409 with the right message for a duplicate serial and for a duplicate externalId', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(unit());

    tx.inventoryUnit.update.mockRejectedValueOnce({ code: 'P2002', meta: { target: ['brand', 'serialNumber'] } });
    const serial = await request(app).put('/api/inventory/unit-1').set(auth).send({ serialNumber: '1' }).expect(409);
    expect(serial.body.error).toMatch(/serial number/);

    tx.inventoryUnit.update.mockRejectedValueOnce({ code: 'P2002', meta: { target: ['externalId'] } });
    const external = await request(app).put('/api/inventory/unit-1').set(auth).send({ externalId: 'x' }).expect(409);
    expect(external.body.error).toMatch(/externalId/);
  });

  it('answers 404 for an unknown unit', async () => {
    tx.inventoryUnit.findUnique.mockResolvedValue(null);

    await request(app).put('/api/inventory/ghost').set(auth).send({ notes: 'x' }).expect(404);
  });
});

describe('GET /api/inventory/:id/movements', () => {
  beforeEach(() => asUser('INVENTARIO'));

  it('returns the history newest first', async () => {
    db.inventoryUnit.findUnique.mockResolvedValue({ id: 'unit-1' });
    db.inventoryMovement.findMany.mockResolvedValue([{ id: 'm1' }]);

    const res = await request(app).get('/api/inventory/unit-1/movements').set(auth).expect(200);

    expect(res.body).toEqual([{ id: 'm1' }]);
    expect(db.inventoryMovement.findMany.mock.calls[0][0]).toMatchObject({
      where: { unitId: 'unit-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('answers 404 for an unknown unit', async () => {
    db.inventoryUnit.findUnique.mockResolvedValue(null);

    await request(app).get('/api/inventory/ghost/movements').set(auth).expect(404);
  });
});

describe('GET /api/inventory: reservedSince', () => {
  beforeEach(() => asUser('INVENTARIO'));

  it('says since when each reserved unit is reserved, and nothing for the others', async () => {
    db.inventoryUnit.findMany.mockResolvedValue([
      unit({ id: 'a', status: 'APARTADA', updatedAt: new Date('2026-10-12T12:00:00Z') }),
      unit({ id: 'b', status: 'DISPONIBLE' }),
      unit({ id: 'c', status: 'APARTADA', updatedAt: new Date('2026-10-14T12:00:00Z') }),
    ]);
    db.inventoryMovement.groupBy.mockResolvedValue([{ unitId: 'a', _max: { createdAt: new Date('2026-10-03T16:00:00Z') } }]);

    const res = await request(app).get('/api/inventory').set(auth).expect(200);

    expect(res.body.map((row: { id: string; reservedSince: string | null }) => [row.id, row.reservedSince])).toEqual([
      ['a', '2026-10-03T16:00:00.000Z'],
      ['b', null],
      // No reservation in the history: falls back to the last update.
      ['c', '2026-10-14T12:00:00.000Z'],
    ]);
    expect(db.inventoryMovement.groupBy.mock.calls[0][0]).toMatchObject({
      by: ['unitId'],
      where: { unitId: { in: ['a', 'c'] }, toStatus: 'APARTADA' },
    });
  });

  it('skips the extra query when nothing is reserved', async () => {
    db.inventoryUnit.findMany.mockResolvedValue([unit({ status: 'DISPONIBLE' })]);

    await request(app).get('/api/inventory').set(auth).expect(200);

    expect(db.inventoryMovement.groupBy).not.toHaveBeenCalled();
  });
});

describe('GET /api/inventory/report', () => {
  it('requires a token', async () => {
    await request(app).get('/api/inventory/report').expect(401);
  });

  it('is closed to INVENTARIO users and reads no data for them', async () => {
    asUser('INVENTARIO');

    await request(app).get('/api/inventory/report').set(auth).expect(403);

    expect(db.inventoryUnit.findMany).not.toHaveBeenCalled();
  });

  it('rejects a month that is not YYYY-MM with 400', async () => {
    asUser('ADMIN');

    for (const month of ['2026-13', '2026-1', 'octubre', '2026-10-01']) {
      await request(app).get('/api/inventory/report').query({ month }).set(auth).expect(400);
    }
    expect(db.inventoryUnit.findMany).not.toHaveBeenCalled();
  });

  it('builds the report of the month from the units and their movements', async () => {
    asUser('ADMIN');
    db.inventoryUnit.findMany.mockResolvedValue([
      {
        ...unit({ id: 'sold', status: 'VENDIDA' }),
        receivedAt: new Date('2026-09-10T00:00:00Z'),
        soldAt: new Date('2026-10-05T00:00:00Z'),
        createdAt: new Date('2026-09-10T12:00:00Z'),
        updatedAt: new Date('2026-10-05T20:00:00Z'),
        movements: [
          { action: 'CREATE', fromStatus: null, toStatus: 'DISPONIBLE', createdAt: new Date('2026-09-10T12:00:00Z') },
          { action: 'STATUS', fromStatus: 'DISPONIBLE', toStatus: 'VENDIDA', createdAt: new Date('2026-10-05T20:00:00Z') },
        ],
      },
    ]);

    const res = await request(app).get('/api/inventory/report').query({ month: '2026-10' }).set(auth).expect(200);

    expect(res.body.month).toBe('2026-10');
    expect(res.body.summary).toMatchObject({ sales: 1, arrivals: 0 });
    expect(res.body.sales[0]).toMatchObject({ id: 'sold', soldAt: '2026-10-05', daysInStock: 25 });
    expect(res.body.responseTime).toMatchObject({ measured: 1, sameDay: 1 });
    // It asks only for what the report needs: no notes, nothing that could leak.
    const select = db.inventoryUnit.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty('notes');
    expect(Object.keys(select.movements.select).sort()).toEqual(['action', 'createdAt', 'fromStatus', 'toStatus']);
  });

  it('defaults to the current month', async () => {
    asUser('ADMIN');
    db.inventoryUnit.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/inventory/report').set(auth).expect(200);

    expect(res.body.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});
