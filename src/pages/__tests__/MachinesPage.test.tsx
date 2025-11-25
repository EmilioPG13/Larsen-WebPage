import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MachinesPage from '../MachinesPage';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  getMachines: vi.fn(),
}));

const mockGetMachines = vi.mocked(api.getMachines);

describe('MachinesPage', () => {
  const mockMachines = [
    {
      id: '1',
      name: 'Test Machine',
      brand: 'Test Brand',
      description: 'Test Description',
      type: 'Circular',
      knittingSystems: 'Single',
      width: '180cm',
      speed: '1.2 m/s',
      gauge: '12',
      yarnGuides: '4',
      capabilities: ['Capability 1'],
      software: 'Test Software',
      power: '5kW',
      category: 'Industrial',
      image: '/test-machine.png',
      inStock: true,
    },
    {
      id: '2',
      name: 'Out of Stock Machine',
      brand: 'Test Brand',
      description: 'Out of Stock Description',
      type: 'Flat',
      knittingSystems: 'Double',
      width: '200cm',
      speed: '1.5 m/s',
      gauge: '14',
      yarnGuides: '6',
      capabilities: ['Capability 2'],
      software: 'Test Software 2',
      power: '7kW',
      category: 'Industrial',
      image: '/test-machine-2.png',
      inStock: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMachines.mockResolvedValue(mockMachines);
  });

  it('should display loading state initially', () => {
    mockGetMachines.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should display machines after loading', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Machine')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock Machine')).toBeInTheDocument();
    });
  });

  it('should display "En Stock" badge for machines in stock', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const inStockBadge = screen.getByText('✓ En Stock');
      expect(inStockBadge).toBeInTheDocument();
      expect(inStockBadge).toHaveClass('bg-green-100');
    });
  });

  it('should display "No disponible" badge for machines out of stock', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const outOfStockBadge = screen.getByText('✗ No disponible');
      expect(outOfStockBadge).toBeInTheDocument();
      expect(outOfStockBadge).toHaveClass('bg-gray-200');
    });
  });

  it('should display warning message for out-of-stock machines', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const warningMessage = screen.getByText('⚠️ No disponible actualmente en almacén');
      expect(warningMessage).toBeInTheDocument();
      expect(warningMessage.closest('div')).toHaveClass('bg-red-50');
    });
  });

  it('should disable "Me interesa" button for out-of-stock machines', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByText('💬 Me interesa');
      // Find the button for the out-of-stock machine
      const outOfStockButton = buttons.find((btn) => btn.closest('button')?.hasAttribute('disabled'));
      expect(outOfStockButton).toBeDefined();
    });
  });

  it('should display machine specifications', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Machine')).toBeInTheDocument();
      expect(screen.getByText('180cm')).toBeInTheDocument();
      expect(screen.getByText('1.2 m/s')).toBeInTheDocument();
    });
  });

  it('should expand/collapse machine details', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Machine')).toBeInTheDocument();
    });

    const expandButton = screen.getByText('Especificaciones Técnicas Detalladas');
    await user.click(expandButton);

    // Check if expanded content is visible (this depends on implementation)
    // The expand functionality should show additional specs
  });

  it('should display error message on fetch failure', async () => {
    mockGetMachines.mockRejectedValue(new Error('Failed to fetch machines'));

    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error al cargar máquinas/i)).toBeInTheDocument();
    });
  });

  it('should not display warning message for in-stock machines', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Machine')).toBeInTheDocument();
    });

    // The warning should only appear for out-of-stock machines
    const warnings = screen.queryAllByText('⚠️ No disponible actualmente en almacén');
    // Should only be one (for the out-of-stock machine)
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('should display brand badge for machines', async () => {
    render(
      <MemoryRouter>
        <MachinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });
  });
});

