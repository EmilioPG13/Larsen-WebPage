import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Machines from '../pages/Machines';
import * as adminApi from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getMachines: vi.fn(),
    updateMachine: vi.fn(),
  },
}));

const api = adminApi.adminApi as unknown as Record<string, Mock>;

const machines = [
  { id: 'aries-3', name: 'Aries.3', brand: 'Steiger', description: 'Máquina rectilínea de última generación para tejido', onOrder: true },
  { id: 'vesta-multi', name: 'Vesta Multi', brand: 'Steiger', description: 'Máquina multigalga para tejido de punto', onOrder: false },
];

describe('Machines page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getMachines.mockResolvedValue(machines);
  });

  it('lists the machines with their "bajo pedido" flag and no stock controls', async () => {
    render(<Machines />);

    expect(await screen.findByText('Aries.3')).toBeInTheDocument();
    expect(screen.getByLabelText('Aries.3 se vende bajo pedido')).toBeChecked();
    expect(screen.getByLabelText('Vesta Multi se vende bajo pedido')).not.toBeChecked();
    expect(screen.queryByText('Gestionar')).not.toBeInTheDocument();
    expect(screen.queryByText(/En Stock/)).not.toBeInTheDocument();
  });

  it('saves the flag through updateMachine', async () => {
    const user = userEvent.setup();
    api.updateMachine.mockResolvedValue({ ...machines[1], onOrder: true });
    render(<Machines />);

    await user.click(await screen.findByLabelText('Vesta Multi se vende bajo pedido'));

    expect(api.updateMachine).toHaveBeenCalledWith('vesta-multi', { onOrder: true });
    await waitFor(() => expect(screen.getByLabelText('Vesta Multi se vende bajo pedido')).toBeChecked());
  });

  it('leaves the checkbox as it was and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    api.updateMachine.mockRejectedValue({ response: { data: { error: 'Machine not found' } } });
    render(<Machines />);

    await user.click(await screen.findByLabelText('Vesta Multi se vende bajo pedido'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Machine not found');
    expect(screen.getByLabelText('Vesta Multi se vende bajo pedido')).not.toBeChecked();
  });

  it('shows an error when the machines cannot be loaded', async () => {
    api.getMachines.mockRejectedValue({ response: { data: { error: 'Boom' } } });
    render(<Machines />);

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
