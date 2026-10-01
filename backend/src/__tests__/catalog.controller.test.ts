import request from 'supertest';
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

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    inventoryUnit: { findMany: jest.fn() },
    machine: { findMany: jest.fn() },
  },
}));

const prisma = prismaClient as unknown as Record<string, Record<string, jest.Mock>>;

const row = (overrides: Record<string, unknown>) => ({
  id: 'u',
  brand: 'Steiger',
  model: 'Gemini',
  gauge: '5',
  serialNumber: '1',
  modality: 'EN_BODEGA',
  machineId: null,
  machine: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  prisma.machine.findMany.mockResolvedValue([]);
});

describe('GET /api/catalog', () => {
  it('is public and never cached', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual([]);
  });

  it('asks only for available units, through a select that excludes internal fields', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([]);

    await request(app).get('/api/catalog').expect(200);

    const args = prisma.inventoryUnit.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ status: 'DISPONIBLE' });
    expect(args.select).toBeDefined();
    expect(args.include).toBeUndefined();
    for (const internal of ['notes', 'soldAt', 'externalId', 'receivedAt', 'status']) {
      expect(args.select).not.toHaveProperty(internal);
    }
  });

  it('does not leak internal fields even if the query returned them', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([
      row({ id: 'a', notes: 'Vendida a Luis', soldAt: new Date(), externalId: 'odoo-1' }),
    ]);

    const res = await request(app).get('/api/catalog').expect(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/notes|soldAt|externalId|Luis/);
  });

  it('groups units by model with their gauges in ascending numeric order', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([
      row({ id: 'a', gauge: '12', serialNumber: '1' }),
      row({ id: 'b', gauge: '5', serialNumber: '2' }),
      row({ id: 'c', gauge: '10', serialNumber: '3' }),
      row({ id: 'd', gauge: '5', serialNumber: '4' }),
      row({ id: 'e', brand: 'Shima Seiki', model: '183FF', gauge: '7', serialNumber: '333' }),
    ]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(res.body).toHaveLength(2);
    const gemini = res.body.find((g: { model: string }) => g.model === 'Gemini');
    expect(gemini.gauges).toEqual(['5', '10', '12']);
    expect(gemini.units).toHaveLength(4);
    expect(gemini.units[0]).toEqual({ id: 'a', gauge: '12', serialNumber: '1' });
    expect(gemini.modality).toBe('EN_BODEGA');
    expect(gemini.image).toBeNull();
    // Sorted alphabetically by brand, then by model.
    expect(res.body.map((g: { brand: string }) => g.brand)).toEqual(['Shima Seiki', 'Steiger']);
  });

  it('uses the spec sheet image and groups every unit of the same sheet together', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([
      row({ id: 'a', model: 'Vesta Multi', gauge: '6', machineId: 'vesta-multi', machine: { image: '/vm.png' } }),
      row({ id: 'b', model: 'VESTA MULTI', gauge: '8', machineId: 'vesta-multi', machine: { image: '/vm.png' } }),
    ]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ machineId: 'vesta-multi', image: '/vm.png', gauges: ['6', '8'] });
  });

  it('lists the models sold to order even with no physical units', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([]);
    prisma.machine.findMany.mockResolvedValue([
      { id: 'aries-3', name: 'Aries.3', brand: 'Steiger', image: '/aries3.png' },
    ]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(prisma.machine.findMany.mock.calls[0][0].where).toEqual({ onOrder: true });
    expect(res.body).toEqual([
      {
        brand: 'Steiger',
        model: 'Aries.3',
        machineId: 'aries-3',
        image: '/aries3.png',
        modality: 'BAJO_PEDIDO',
        gauges: [],
        units: [],
      },
    ]);
  });

  it('answers a model that is both on order and in the warehouse as in stock', async () => {
    prisma.machine.findMany.mockResolvedValue([
      { id: 'vesta-multi', name: 'Vesta Multi', brand: 'Steiger', image: '/vm.png' },
    ]);
    prisma.inventoryUnit.findMany.mockResolvedValue([
      row({ id: 'a', model: 'Vesta Multi', gauge: '6', machineId: 'vesta-multi', machine: { image: '/vm.png' } }),
    ]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].modality).toBe('EN_BODEGA');
    expect(res.body[0].units).toHaveLength(1);
  });

  it('does not duplicate a model when a unit has no machineId but its name matches an on-order sheet', async () => {
    prisma.machine.findMany.mockResolvedValue([
      { id: 'aries-3', name: 'Aries.3', brand: 'Steiger', image: '/aries3.png' },
    ]);
    prisma.inventoryUnit.findMany.mockResolvedValue([
      row({ id: 'a', model: 'ARIES.3', gauge: '7', serialNumber: '55', machineId: null }),
    ]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ machineId: 'aries-3', image: '/aries3.png', modality: 'EN_BODEGA' });
    expect(res.body[0].units).toEqual([{ id: 'a', gauge: '7', serialNumber: '55' }]);
  });

  it('keeps a group on order when all of its units are still on their way', async () => {
    prisma.inventoryUnit.findMany.mockResolvedValue([row({ id: 'a', modality: 'BAJO_PEDIDO' })]);

    const res = await request(app).get('/api/catalog').expect(200);

    expect(res.body[0].modality).toBe('BAJO_PEDIDO');
  });

  it('answers 500 with a generic message when the database fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prisma.inventoryUnit.findMany.mockRejectedValue(new Error('connection refused to neon'));

    const res = await request(app).get('/api/catalog').expect(500);

    expect(JSON.stringify(res.body)).not.toMatch(/neon/);
  });
});
