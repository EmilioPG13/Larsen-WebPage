import { describe, it, expect, vi, afterEach } from 'vitest';
import { createInventoryPdf, exportInventoryPdf } from '../utils/inventoryPdf';
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
  unit({ model: 'Vesta 130E', serialNumber: '4738/96', gauge: '7' }),
  unit({ model: 'Gemini', serialNumber: '7429', gauge: '10', status: 'VENDIDA', notes: 'Vendida a Luis Leon' }),
  unit({ brand: 'Shima Seiki', model: '183FF', serialNumber: '333', gauge: '7', status: 'APARTADA' }),
];

describe('createInventoryPdf', () => {
  it('produces a landscape document with the unit table and a closing summary page', async () => {
    const doc = await createInventoryPdf(units, now);

    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight());
    expect(doc.output().startsWith('%PDF-')).toBe(true);
  });

  it('carries the title, the units, the statuses and the summary sections', async () => {
    const text = (await createInventoryPdf(units, now)).output();

    for (const expected of [
      'INVENTARIO BODEGA MEXICO',
      'RESUMEN DE INVENTARIO',
      'Generado el 2 de octubre de 2026',
      '4738/96',
      'Vendida a Luis Leon',
      'Disponible',
      'Apartada',
      'Vendida',
      'Shima',
      'Por marca',
      'Disponibles por galga',
      'Ventas por mes',
    ]) {
      expect(text).toContain(expected);
    }
  });

  it('numbers every page against the total', async () => {
    const many = Array.from({ length: 70 }, (_, index) => unit({ serialNumber: String(1000 + index) }));
    const doc = await createInventoryPdf(many, now);
    const pages = doc.getNumberOfPages();

    expect(pages).toBeGreaterThan(2);
    expect(doc.output()).toContain(`gina ${pages} de ${pages}`);
  });

  it('still produces a document with no units', async () => {
    const doc = await createInventoryPdf([], now);

    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.output()).toContain('Sin unidades disponibles');
  });
});

describe('exportInventoryPdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads the PDF with the local date in its name', async () => {
    const created = vi.fn(() => 'blob:fake');
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: vi.fn() });
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });

    await exportInventoryPdf(units, now);

    expect(downloads).toEqual(['INVENTARIO BODEGA MEXICO (2026-10-02).pdf']);
    expect((created.mock.calls[0] as unknown as [Blob])[0].type).toBe('application/pdf');
  });
});
