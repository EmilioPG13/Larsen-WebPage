import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Brands from '../pages/Brands';
import * as adminApi from '../services/adminApi';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getBrands: vi.fn(),
    deleteBrand: vi.fn(),
  },
}));

const mockAdminApi = adminApi.adminApi as unknown as Record<string, Mock>;

const mockBrands = [
  {
    id: 'b1',
    name: 'PROTTI',
    image: '/protti.png',
    description: 'Máquinas italianas',
    specialties: ['Alta precisión'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    name: 'STOLL',
    image: '/stoll.png',
    description: 'Máquinas de punto',
    specialties: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Brands Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminApi.getBrands.mockResolvedValue(mockBrands);
    mockAdminApi.deleteBrand.mockResolvedValue({ message: 'Brand deleted successfully' });
  });

  it('lists the brands with a delete button each', async () => {
    render(<Brands />);

    await waitFor(() => {
      expect(screen.getByText('STOLL')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Eliminar marca')).toHaveLength(2);
  });

  it('deletes the brand after confirmation and reloads the list', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Brands />);

    await waitFor(() => {
      expect(screen.getByText('STOLL')).toBeInTheDocument();
    });
    await user.click(screen.getAllByText('Eliminar marca')[1]);

    await waitFor(() => {
      expect(mockAdminApi.deleteBrand).toHaveBeenCalledWith('b2');
    });
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('STOLL'));
    expect(mockAdminApi.getBrands).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });

  it('does not delete when the confirmation is declined', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Brands />);

    await waitFor(() => {
      expect(screen.getByText('PROTTI')).toBeInTheDocument();
    });
    await user.click(screen.getAllByText('Eliminar marca')[0]);

    expect(mockAdminApi.deleteBrand).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
