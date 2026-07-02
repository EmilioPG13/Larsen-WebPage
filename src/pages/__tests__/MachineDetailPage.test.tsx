import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MachineDetailPage from '../MachineDetailPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({ getMachines: vi.fn() }));
const mockGetMachines = vi.mocked(api.getMachines);

const machine = {
  id: 'aries-3',
  name: 'Steiger Aries.3',
  brand: 'Steiger',
  description: 'Máquina compacta y versátil.',
  type: 'Rectilínea',
  knittingSystems: '3 sistemas',
  width: '52"',
  speed: '1.6 m/s',
  gauge: '5-16',
  yarnGuides: '16',
  capabilities: ['Intarsia', 'Jacquard'],
  software: 'Model',
  power: '3.5 kW',
  category: 'Rectilínea',
  image: '/images/machines/ARIES3.png',
  inStock: true,
};

const renderAt = (path: string) =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/maquinas/:id" element={<MachineDetailPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('MachineDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMachines.mockResolvedValue([machine]);
  });

  it('renders the machine details for a matching id', async () => {
    renderAt('/maquinas/aries-3');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Steiger Aries.3' })).toBeInTheDocument();
    });
    expect(screen.getByText('1.6 m/s')).toBeInTheDocument();
    expect(screen.getAllByText('Steiger').length).toBeGreaterThan(0);
  });

  it('shows a not-found state for an unknown id', async () => {
    renderAt('/maquinas/does-not-exist');
    await waitFor(() => {
      expect(screen.getByText(/volver a máquinas/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Steiger Aries.3' })).not.toBeInTheDocument();
  });
});
