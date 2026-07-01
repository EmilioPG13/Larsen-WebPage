import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import MachinesPage from '../MachinesPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  getMachines: vi.fn(),
}));

const mockGetMachines = vi.mocked(api.getMachines);

const renderPage = (ui: ReactNode) =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

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

  it('displays the loading state initially', () => {
    mockGetMachines.mockImplementation(() => new Promise(() => {}));
    renderPage(<MachinesPage />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('displays machines after loading', async () => {
    renderPage(<MachinesPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Machine')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock Machine')).toBeInTheDocument();
    });
  });

  it('shows an in-stock badge and an out-of-stock badge', async () => {
    renderPage(<MachinesPage />);
    await waitFor(() => {
      expect(screen.getByText('En stock')).toBeInTheDocument();
      // "No disponible" appears both as the badge and the disabled button label
      expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
    });
  });

  it('disables the interest button for out-of-stock machines', async () => {
    renderPage(<MachinesPage />);
    await waitFor(() => {
      const disabled = screen
        .getAllByRole('button')
        .find((b) => b.hasAttribute('disabled'));
      expect(disabled).toBeTruthy();
    });
  });

  it('displays machine specifications', async () => {
    renderPage(<MachinesPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Machine')).toBeInTheDocument();
      expect(screen.getByText('180cm')).toBeInTheDocument();
      expect(screen.getByText('1.2 m/s')).toBeInTheDocument();
    });
  });

  it('displays an error message on fetch failure', async () => {
    mockGetMachines.mockRejectedValue(new Error('Failed to fetch machines'));
    renderPage(<MachinesPage />);
    await waitFor(() => {
      expect(screen.getByText(/error al cargar máquinas/i)).toBeInTheDocument();
    });
  });

  it('displays the brand badge for machines', async () => {
    renderPage(<MachinesPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Test Brand').length).toBeGreaterThan(0);
    });
  });
});
