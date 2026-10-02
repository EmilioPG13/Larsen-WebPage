import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Inventory from '../pages/Inventory';
import * as adminApi from '../services/adminApi';
import * as exporter from '../utils/inventoryExport';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getInventory: vi.fn(),
    createInventoryUnit: vi.fn(),
    updateInventoryUnit: vi.fn(),
    setInventoryStatus: vi.fn(),
    getInventoryMovements: vi.fn(),
    deleteInventoryUnit: vi.fn(),
  },
}));

vi.mock('../utils/inventoryExport', () => ({
  exportInventoryXlsx: vi.fn(),
}));

const api = adminApi.adminApi as unknown as Record<string, Mock>;
const exportXlsx = exporter.exportInventoryXlsx as unknown as Mock;

const now = '2026-10-01T15:00:00.000Z';
const makeUnit = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  brand: 'Steiger',
  model: 'Gemini',
  gauge: '5',
  serialNumber: '9596/11',
  status: 'DISPONIBLE',
  modality: 'EN_BODEGA',
  receivedAt: null,
  soldAt: null,
  notes: null,
  machineId: null,
  createdAt: now,
  updatedAt: now,
  movements: [],
  ...overrides,
});

const units = [
  makeUnit(),
  makeUnit({ id: 'u2', model: 'Vesta 130E', gauge: '7', serialNumber: '4738/96' }),
  makeUnit({ id: 'u3', brand: 'Shima Seiki', model: '183FF', gauge: '7', serialNumber: '333', status: 'APARTADA' }),
  makeUnit({
    id: 'u4',
    model: 'Gemini',
    gauge: '10',
    serialNumber: '7429',
    status: 'VENDIDA',
    soldAt: '2026-09-20T00:00:00.000Z',
    notes: 'Vendida a Luis Leon',
    movements: [
      {
        id: 'm1', unitId: 'u4', action: 'STATUS', fromStatus: 'DISPONIBLE', toStatus: 'VENDIDA',
        changes: null, createdAt: now, user: { id: 'u9', name: 'Ivo Inventario', email: 'ivo@example.com' },
      },
    ],
  }),
];

const loginAs = (role: 'ADMIN' | 'INVENTARIO') =>
  localStorage.setItem('admin_user', JSON.stringify({ id: 'u9', email: 'x@example.com', name: null, role }));

const rows = () => screen.getAllByTestId('unit-row');

describe('Inventory page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    loginAs('INVENTARIO');
    api.getInventory.mockResolvedValue(units);
    api.setInventoryStatus.mockResolvedValue(makeUnit());
  });

  it('shows the loading state first', async () => {
    api.getInventory.mockImplementation(() => new Promise(() => {}));
    render(<Inventory />);
    expect(screen.getByText('Cargando inventario...')).toBeInTheDocument();
  });

  it('lists the units ordered by brand (Steiger first) and gauge, with the last change', async () => {
    render(<Inventory />);

    await screen.findByText('Vesta 130E', { exact: false });
    expect(rows()).toHaveLength(4);
    // On narrow screens the serial carries a "Serie" label inside the same element.
    const order = rows().map((row) =>
      within(row).getByText(/^(Serie )?(9596\/11|4738\/96|333|7429)$/).textContent?.replace('Serie ', '')
    );
    expect(order).toEqual(['9596/11', '4738/96', '7429', '333']);

    const sold = rows()[2];
    expect(within(sold).getByText('Ivo Inventario')).toBeInTheDocument();
    expect(within(sold).getByText(/Vendida el/)).toBeInTheDocument();
  });

  it('shows a counter per status and filters by it', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    expect(screen.getByRole('button', { name: 'Todas (4)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disponibles (2)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vendidas (1)' }));
    expect(rows()).toHaveLength(1);
    expect(screen.getByText('7429')).toBeInTheDocument();
  });

  it('filters by brand and searches by serial number or model', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.selectOptions(screen.getByLabelText('Filtrar por marca'), 'Shima Seiki');
    expect(rows()).toHaveLength(1);

    await user.selectOptions(screen.getByLabelText('Filtrar por marca'), '');
    await user.type(screen.getByLabelText('Buscar por número de serie o modelo'), '4738');
    expect(rows()).toHaveLength(1);
    expect(screen.getByText('4738/96')).toBeInTheDocument();
  });

  it('tells the person when no unit matches the filters', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.type(screen.getByLabelText('Buscar por número de serie o modelo'), 'zzz');

    expect(screen.getByText('Ninguna unidad coincide con los filtros.')).toBeInTheDocument();
  });

  it('reserves a unit with one click and reloads the list', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    const group = screen.getByRole('group', { name: 'Estado de la unidad 9596/11' });
    await user.click(within(group).getByRole('button', { name: 'Apartada' }));

    expect(api.setInventoryStatus).toHaveBeenCalledWith('u1', 'APARTADA', undefined);
    await waitFor(() => expect(api.getInventory).toHaveBeenCalledTimes(2));
  });

  it('does nothing when the current status is clicked again', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    const group = screen.getByRole('group', { name: 'Estado de la unidad 9596/11' });
    await user.click(within(group).getByRole('button', { name: 'Disponible' }));

    expect(api.setInventoryStatus).not.toHaveBeenCalled();
  });

  it('asks for confirmation with today as the sale date before marking a unit as sold', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    const group = screen.getByRole('group', { name: 'Estado de la unidad 9596/11' });
    await user.click(within(group).getByRole('button', { name: 'Vendida' }));

    expect(api.setInventoryStatus).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Marcar como vendida' });
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(within(dialog).getByLabelText('Fecha de venta')).toHaveValue(expected);

    await user.click(within(dialog).getByRole('button', { name: 'Confirmar venta' }));

    expect(api.setInventoryStatus).toHaveBeenCalledWith('u1', 'VENDIDA', expected);
    expect(screen.queryByRole('dialog', { name: 'Marcar como vendida' })).not.toBeInTheDocument();
  });

  it('keeps the unit untouched when the sale is cancelled', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    const group = screen.getByRole('group', { name: 'Estado de la unidad 9596/11' });
    await user.click(within(group).getByRole('button', { name: 'Vendida' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(api.setInventoryStatus).not.toHaveBeenCalled();
  });

  it('shows the API error when a status change fails', async () => {
    const user = userEvent.setup();
    api.setInventoryStatus.mockRejectedValue({ response: { data: { error: 'Unit not found' } } });
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    const group = screen.getByRole('group', { name: 'Estado de la unidad 9596/11' });
    await user.click(within(group).getByRole('button', { name: 'Apartada' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unit not found');
  });

  it('creates a unit from the form', async () => {
    const user = userEvent.setup();
    api.createInventoryUnit.mockResolvedValue(makeUnit({ id: 'new' }));
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.click(screen.getByRole('button', { name: 'Nueva unidad' }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva unidad' });
    await user.clear(within(dialog).getByLabelText('Marca'));
    await user.type(within(dialog).getByLabelText('Marca'), 'Steiger');
    await user.type(within(dialog).getByLabelText('Modelo'), 'Vesta Multi');
    await user.type(within(dialog).getByLabelText('Galga'), '6');
    await user.type(within(dialog).getByLabelText('No. de serie'), '6689/02');
    await user.type(within(dialog).getByLabelText(/Observaciones/), 'revisar motor');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(api.createInventoryUnit).toHaveBeenCalledWith({
      brand: 'Steiger',
      model: 'Vesta Multi',
      gauge: '6',
      serialNumber: '6689/02',
      modality: 'EN_BODEGA',
      status: 'DISPONIBLE',
      notes: 'revisar motor',
    });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva unidad' })).not.toBeInTheDocument());
  });

  it('keeps the form open and shows the error when saving fails (duplicate serial)', async () => {
    const user = userEvent.setup();
    api.createInventoryUnit.mockRejectedValue({
      response: { data: { error: 'A unit with that brand and serial number already exists' } },
    });
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.click(screen.getByRole('button', { name: 'Nueva unidad' }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva unidad' });
    await user.type(within(dialog).getByLabelText('Modelo'), 'Gemini');
    await user.type(within(dialog).getByLabelText('Galga'), '5');
    await user.type(within(dialog).getByLabelText('No. de serie'), '9596/11');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('already exists');
    expect(screen.getByRole('dialog', { name: 'Nueva unidad' })).toBeInTheDocument();
  });

  it('edits a unit, sending the whole form with blanks as null', async () => {
    const user = userEvent.setup();
    api.updateInventoryUnit.mockResolvedValue(makeUnit());
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.click(screen.getByRole('button', { name: 'Editar Gemini serie 9596/11' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar unidad' });
    expect(within(dialog).getByLabelText('No. de serie')).toHaveValue('9596/11');
    await user.type(within(dialog).getByLabelText(/Observaciones/), 'nota nueva');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(api.updateInventoryUnit).toHaveBeenCalledWith('u1', {
      brand: 'Steiger',
      model: 'Gemini',
      gauge: '5',
      serialNumber: '9596/11',
      modality: 'EN_BODEGA',
      receivedAt: null,
      notes: 'nota nueva',
    });
  });

  it('lets a sold unit keep its sale date when edited', async () => {
    const user = userEvent.setup();
    api.updateInventoryUnit.mockResolvedValue(makeUnit());
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.click(screen.getByRole('button', { name: 'Editar Gemini serie 7429' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar unidad' });
    expect(within(dialog).getByLabelText('Fecha de venta')).toHaveValue('2026-09-20');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(api.updateInventoryUnit.mock.calls[0][1]).toMatchObject({ soldAt: '2026-09-20' });
  });

  it('opens the history of a unit with who did what', async () => {
    const user = userEvent.setup();
    api.getInventoryMovements.mockResolvedValue([
      {
        id: 'm1', unitId: 'u4', action: 'STATUS', fromStatus: 'DISPONIBLE', toStatus: 'VENDIDA',
        changes: { soldAt: [null, '2026-09-20T00:00:00.000Z'] }, createdAt: now,
        user: { id: 'u9', name: 'Ivo Inventario', email: 'ivo@example.com' },
      },
      {
        id: 'm0', unitId: 'u4', action: 'IMPORT', fromStatus: null, toStatus: 'DISPONIBLE',
        changes: null, createdAt: now, user: null,
      },
    ]);
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.click(screen.getByRole('button', { name: 'Historial de Gemini serie 7429' }));

    const dialog = await screen.findByRole('dialog', { name: 'Historial' });
    expect(await within(dialog).findByText(/Cambio de estado · Ivo Inventario/)).toBeInTheDocument();
    expect(within(dialog).getByText('Estado: Disponible → Vendida')).toBeInTheDocument();
    expect(within(dialog).getByText('Fecha de venta: — → 2026-09-20')).toBeInTheDocument();
    expect(within(dialog).getByText(/Importación del Excel · Importación/)).toBeInTheDocument();
    expect(api.getInventoryMovements).toHaveBeenCalledWith('u4');
  });

  describe('delete button', () => {
    it('is hidden for an INVENTARIO user', async () => {
      loginAs('INVENTARIO');
      render(<Inventory />);
      await screen.findByText('Vesta 130E', { exact: false });

      expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument();
    });

    it('deletes after confirmation for an ADMIN', async () => {
      const user = userEvent.setup();
      loginAs('ADMIN');
      api.deleteInventoryUnit.mockResolvedValue({ message: 'ok' });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<Inventory />);
      await screen.findByText('Vesta 130E', { exact: false });

      await user.click(screen.getByRole('button', { name: 'Eliminar Gemini serie 9596/11' }));

      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('9596/11'));
      expect(api.deleteInventoryUnit).toHaveBeenCalledWith('u1');
      await waitFor(() => expect(rows()).toHaveLength(3));
      confirmSpy.mockRestore();
    });

    it('does not delete when the confirmation is declined', async () => {
      const user = userEvent.setup();
      loginAs('ADMIN');
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<Inventory />);
      await screen.findByText('Vesta 130E', { exact: false });

      await user.click(screen.getByRole('button', { name: 'Eliminar Gemini serie 9596/11' }));

      expect(api.deleteInventoryUnit).not.toHaveBeenCalled();
      expect(rows()).toHaveLength(4);
      confirmSpy.mockRestore();
    });
  });

  it('exports every unit, not only the filtered ones', async () => {
    const user = userEvent.setup();
    render(<Inventory />);
    await screen.findByText('Vesta 130E', { exact: false });

    await user.click(screen.getByRole('button', { name: 'Vendidas (1)' }));
    await user.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(exportXlsx).toHaveBeenCalledTimes(1);
    expect(exportXlsx.mock.calls[0][0]).toHaveLength(4);
  });

  it('shows an empty state when there are no units yet, and disables the export', async () => {
    api.getInventory.mockResolvedValue([]);
    render(<Inventory />);

    expect(await screen.findByText('Todavía no hay unidades en el inventario.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar Excel' })).toBeDisabled();
  });

  it('shows an error when the list cannot be loaded', async () => {
    api.getInventory.mockRejectedValue({ response: { data: { error: 'Insufficient permissions' } } });
    render(<Inventory />);

    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
  });
});
