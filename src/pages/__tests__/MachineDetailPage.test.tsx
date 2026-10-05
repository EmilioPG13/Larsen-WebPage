import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MachineDetailPage from '../MachineDetailPage';
import { LanguageProvider, useLanguage } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import * as api from '../../services/api';
import * as analytics from '../../services/analytics';

vi.mock('../../services/api', () => ({ getMachines: vi.fn(), getCatalog: vi.fn() }));
vi.mock('../../services/analytics', () => ({ track: vi.fn() }));
const mockGetMachines = vi.mocked(api.getMachines);
const mockGetCatalog = vi.mocked(api.getCatalog);
const mockTrack = vi.mocked(analytics.track);

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
  en: {
    description: 'Compact and versatile machine.',
    software: 'Logica programming system',
  },
};

const LangProbe = () => {
  const { setLang } = useLanguage();
  return <button onClick={() => setLang('en')}>to-en</button>;
};

const renderAt = (path: string) =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <LangProbe />
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
    mockGetCatalog.mockResolvedValue([]);
  });

  it('renders the machine details for a matching id', async () => {
    renderAt('/maquinas/aries-3');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Steiger Aries.3' })).toBeInTheDocument();
    });
    expect(screen.getByText('1.6 m/s')).toBeInTheDocument();
    expect(screen.getAllByText('Steiger').length).toBeGreaterThan(0);
  });

  it('lists the units of this model that are in stock, each linking to a unit quote', async () => {
    mockGetCatalog.mockResolvedValue([
      {
        brand: 'Steiger',
        model: 'Aries.3',
        machineId: 'aries-3',
        image: null,
        modality: 'EN_BODEGA',
        gauges: ['10'],
        units: [{ id: 'u1', gauge: '10', serialNumber: '6212/05' }],
      },
      {
        brand: 'Steiger',
        model: 'Other',
        machineId: 'other',
        image: null,
        modality: 'EN_BODEGA',
        gauges: ['7'],
        units: [{ id: 'u2', gauge: '7', serialNumber: '111' }],
      },
    ]);
    renderAt('/maquinas/aries-3');

    const link = await screen.findByRole('link', { name: /Cotizar Aries.3 Serie 6212\/05/ });
    expect(new URL(link.getAttribute('href')!, 'http://x').searchParams.get('unit')).toBe('u1');
    expect(screen.queryByText('111')).not.toBeInTheDocument();
  });

  it('shows no unit list when the model has no units or the catalog is down', async () => {
    mockGetCatalog.mockRejectedValue(new Error('network'));
    renderAt('/maquinas/aries-3');

    await screen.findByRole('heading', { name: 'Steiger Aries.3' });
    await waitFor(() => expect(mockGetCatalog).toHaveBeenCalled());
    expect(screen.queryByText('Unidades disponibles')).not.toBeInTheDocument();
  });

  it('tracks the brand, model and gauge with the page view', async () => {
    renderAt('/maquinas/aries-3');

    await screen.findByRole('heading', { name: 'Steiger Aries.3' });
    expect(mockTrack).toHaveBeenCalledWith('view_machine_detail', {
      machine_id: 'aries-3',
      machine_name: 'Steiger Aries.3',
      brand: 'Steiger',
      model: 'Steiger Aries.3',
      gauge: '5-16',
    });
  });

  it('shows a not-found state for an unknown id', async () => {
    renderAt('/maquinas/does-not-exist');
    await waitFor(() => {
      expect(screen.getByText(/volver a máquinas/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Steiger Aries.3' })).not.toBeInTheDocument();
  });

  it('translates specs to english and tracks view_machine_detail only once', async () => {
    renderAt('/maquinas/aries-3');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Steiger Aries.3' })).toBeInTheDocument();
    });
    // The tracking effect runs after the commit that shows the heading, so wait for it.
    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'to-en' }));

    await waitFor(() => {
      expect(screen.getByText('Logica programming system')).toBeInTheDocument();
    });
    expect(screen.getByText('Compact and versatile machine.')).toBeInTheDocument();
    // Let the effects of the language switch flush before asserting nothing re-tracked.
    await act(async () => {});
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });
});
