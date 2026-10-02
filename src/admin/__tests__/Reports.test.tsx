import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from '../pages/Reports';
import * as adminApi from '../services/adminApi';
import { monthOf } from '../utils/inventoryLabels';
import type { MonthlyReport } from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: { getMonthlyReport: vi.fn() },
}));

const api = adminApi.adminApi as unknown as Record<string, Mock>;

const unit = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  brand: 'Steiger',
  model: 'Vesta 130E',
  gauge: '7',
  serialNumber: '4738/96',
  ...overrides,
});

const report = (overrides: Partial<MonthlyReport> = {}): MonthlyReport => ({
  month: monthOf(),
  summary: { arrivals: 2, sales: 1, reservations: 3, stockAtClose: { available: 12, reserved: 2, total: 14 } },
  sales: [
    {
      ...unit({ id: 's1', model: 'Gemini', gauge: '10', serialNumber: '7429' }),
      soldAt: '2026-10-05',
      daysInStock: 25,
    },
  ],
  responseTime: { measured: 3, sameDay: 2, averageDays: 1.3, worstDays: 3, notMeasurable: 0 },
  aging: {
    onHand: 14,
    withReceivedDate: 2,
    withoutReceivedDate: 12,
    averageDays: 45.3,
    oldest: [{ ...unit({ id: 'o1' }), receivedAt: '2026-07-22', days: 90 }],
    averageDaysToSell: 25,
  },
  staleAfterDays: 15,
  staleReservations: [{ ...unit({ id: 'r1', model: '183FF', serialNumber: '333' }), since: '2026-09-01', days: 49 }],
  ...overrides,
});

describe('Reports page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getMonthlyReport.mockResolvedValue(report());
  });

  it('loads the current month first and shows the four figures', async () => {
    render(<Reports />);

    expect(screen.getByText('Cargando reporte...')).toBeInTheDocument();
    expect(await screen.findByText('Llegadas')).toBeInTheDocument();

    expect(api.getMonthlyReport).toHaveBeenCalledWith(monthOf());
    const figures = ['Llegadas', 'Ventas', 'Apartados', 'Inventario hoy'].map(
      (label) => screen.getByText(label).nextElementSibling?.textContent,
    );
    expect(figures).toEqual(['2', '1', '3', '14']);
    expect(screen.getByText('12 disponibles · 2 apartadas')).toBeInTheDocument();
  });

  it('asks for another month when it is picked, and calls the stock "al cierre" for a past one', async () => {
    const user = userEvent.setup();
    render(<Reports />);
    await screen.findByText('Llegadas');

    await user.click(screen.getByLabelText('Mes'));
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(12);
    await user.click(options[1]);

    await waitFor(() => expect(api.getMonthlyReport).toHaveBeenCalledTimes(2));
    const previous = api.getMonthlyReport.mock.calls[1][0] as string;
    expect(previous).toMatch(/^\d{4}-\d{2}$/);
    expect(previous).not.toBe(monthOf());
    expect(await screen.findByText('Inventario al cierre')).toBeInTheDocument();
  });

  it('lists the sales of the month with the days in stock and the average time to sell', async () => {
    render(<Reports />);

    const row = (await screen.findByText('7429')).closest('tr') as HTMLElement;
    expect(within(row).getByText(/Steiger Gemini/)).toBeInTheDocument();
    expect(within(row).getByText('25 días')).toBeInTheDocument();
    expect(screen.getByText(/en promedio desde que llegaron/)).toBeInTheDocument();
  });

  it('says so when there are no sales', async () => {
    api.getMonthlyReport.mockResolvedValue(
      report({
        sales: [],
        summary: { ...report().summary, sales: 0 },
        aging: { ...report().aging, averageDaysToSell: null },
      }),
    );
    render(<Reports />);

    expect(await screen.findByText('No hay ventas con fecha en este mes.')).toBeInTheDocument();
    expect(screen.queryByText(/en promedio desde que llegaron/)).not.toBeInTheDocument();
  });

  it('shows how many sales were recorded the same day, with the average and the worst delay', async () => {
    render(<Reports />);

    expect(await screen.findByText(/2 de 3/)).toBeInTheDocument();
    expect(screen.getByText(/registradas el mismo día/)).toBeInTheDocument();
    expect(screen.getByText('1.3 días')).toBeInTheDocument();
    expect(screen.getByText('3 días', { selector: 'strong' })).toBeInTheDocument();
  });

  it('explains the sales that cannot be measured', async () => {
    api.getMonthlyReport.mockResolvedValue(
      report({ responseTime: { measured: 0, sameDay: 0, averageDays: null, worstDays: null, notMeasurable: 3 } }),
    );
    render(<Reports />);

    expect(await screen.findByText('No hay ventas del mes que se puedan medir.')).toBeInTheDocument();
    expect(screen.getByText(/3 ventas vienen de la carga inicial del Excel/)).toBeInTheDocument();
  });

  it('shows the age of the stock, the oldest units and a nudge for the ones with no arrival date', async () => {
    render(<Reports />);

    expect(await screen.findByText(/en bodega, con/)).toHaveTextContent(
      '14 unidades en bodega, con 45 días de antigüedad',
    );
    expect(screen.getByText('Las más antiguas')).toBeInTheDocument();
    expect(screen.getByText('90 días')).toBeInTheDocument();
    expect(screen.getByText(/12 unidades no tienen fecha de llegada/)).toBeInTheDocument();
  });

  it('flags the reservations held too long', async () => {
    render(<Reports />);

    expect(await screen.findByText('Apartadas hace más de 15 días')).toBeInTheDocument();
    expect(screen.getByText(/Steiger 183FF/)).toBeInTheDocument();
    expect(screen.getByText(/49 días apartada/)).toBeInTheDocument();
  });

  it('says so when no reservation is stale', async () => {
    api.getMonthlyReport.mockResolvedValue(report({ staleReservations: [] }));
    render(<Reports />);

    expect(await screen.findByText('Ninguna: todas las unidades apartadas están al día.')).toBeInTheDocument();
  });

  it('shows the error when the report cannot be loaded', async () => {
    api.getMonthlyReport.mockRejectedValue({ response: { data: { error: 'Insufficient permissions' } } });
    render(<Reports />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient permissions');
  });
});
