import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import MachinesPage from '../MachinesPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { es } from '../../i18n/dictionary';
import * as api from '../../services/api';
import * as analytics from '../../services/analytics';
import type { CatalogModel } from '../../types';

vi.mock('../../services/api', () => ({ getCatalog: vi.fn() }));
vi.mock('../../services/analytics', () => ({ track: vi.fn() }));

const mockGetCatalog = vi.mocked(api.getCatalog);
const mockTrack = vi.mocked(analytics.track);

const renderPage = (ui: ReactNode, path = '/maquinas') =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

const catalog: CatalogModel[] = [
  {
    brand: 'Shima Seiki',
    model: 'SES 122S',
    machineId: null,
    image: null,
    modality: 'EN_BODEGA',
    gauges: ['7', '12'],
    units: [
      { id: 'u-shima-1', gauge: '7', serialNumber: '298' },
      { id: 'u-shima-2', gauge: '12', serialNumber: '333' },
    ],
  },
  {
    brand: 'Steiger',
    model: 'Aries.3',
    machineId: 'steiger-aries-3',
    image: '/images/machines/ARIES3.png',
    modality: 'BAJO_PEDIDO',
    gauges: [],
    units: [],
  },
  {
    brand: 'Steiger',
    model: 'Vesta Multi',
    machineId: 'vesta-multi',
    image: '/images/machines/VESTA.png',
    modality: 'EN_BODEGA',
    gauges: ['10'],
    units: [{ id: 'u-vesta-1', gauge: '10', serialNumber: '6212/05' }],
  },
];

describe('MachinesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCatalog.mockResolvedValue(catalog);
  });

  it('displays the loading state initially', () => {
    mockGetCatalog.mockImplementation(() => new Promise(() => {}));
    renderPage(<MachinesPage />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows one card per model, tagged ready-to-ship or made-to-order', async () => {
    renderPage(<MachinesPage />);

    expect(await screen.findByRole('heading', { name: 'SES 122S' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aries.3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vesta Multi' })).toBeInTheDocument();
    expect(screen.getAllByText(es.mpage.readyNow)).toHaveLength(2);
    expect(screen.getAllByText(es.mpage.onOrder)).toHaveLength(1);
  });

  it('lists the serial number and gauge of each unit', async () => {
    renderPage(<MachinesPage />);

    await screen.findByRole('heading', { name: 'SES 122S' });
    expect(screen.getByText('298')).toBeInTheDocument();
    expect(screen.getByText('333')).toBeInTheDocument();
    expect(screen.getByText('6212/05')).toBeInTheDocument();
  });

  it('links a unit to the quote form with its serial and unit id, and tracks select_unit', async () => {
    renderPage(<MachinesPage />);

    const link = await screen.findByRole('link', { name: /Cotizar SES 122S Serie 333/ });
    const url = new URL(link.getAttribute('href')!, 'http://x');
    expect(url.pathname).toBe('/cotizacion');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      machine: 'SES 122S',
      brand: 'Shima Seiki',
      gauge: '12',
      serial: '333',
      unit: 'u-shima-2',
    });

    fireEvent.click(link);
    expect(mockTrack).toHaveBeenCalledWith('select_unit', {
      brand: 'Shima Seiki',
      model: 'SES 122S',
      gauge: '12',
      serial_number: '333',
    });
  });

  it('offers a made-to-order model a plain quote link instead of a unit list', async () => {
    renderPage(<MachinesPage />);

    const card = (await screen.findByRole('heading', { name: 'Aries.3' })).closest('article')!;
    expect(within(card).getByText(es.mpage.onOrderNote)).toBeInTheDocument();
    const quote = within(card).getByRole('link', { name: es.mpage.quoteModel });
    const url = new URL(quote.getAttribute('href')!, 'http://x');
    expect(url.searchParams.get('machine')).toBe('Aries.3');
    expect(url.searchParams.has('serial')).toBe(false);
  });

  it('links to the spec sheet only for models that have one', async () => {
    renderPage(<MachinesPage />);

    const withSheet = (await screen.findByRole('heading', { name: 'Vesta Multi' })).closest('article')!;
    expect(within(withSheet).getByRole('link', { name: /Ver detalle/ })).toHaveAttribute('href', '/maquinas/vesta-multi');
    const without = screen.getByRole('heading', { name: 'SES 122S' }).closest('article')!;
    expect(within(without).queryByRole('link', { name: /Ver detalle/ })).not.toBeInTheDocument();
  });

  it('falls back to the brand logo when the model has no image', async () => {
    renderPage(<MachinesPage />);

    const card = (await screen.findByRole('heading', { name: 'SES 122S' })).closest('article')!;
    expect(within(card).getByRole('img', { name: 'Shima Seiki' })).toHaveAttribute('src', expect.stringContaining('SHIMA'));
  });

  it('filters by brand', async () => {
    renderPage(<MachinesPage />);
    await screen.findByRole('heading', { name: 'SES 122S' });

    const brandGroup = screen.getByRole('group', { name: es.mpage.filterBrand });
    fireEvent.click(within(brandGroup).getByRole('button', { name: 'Steiger' }));

    expect(screen.queryByRole('heading', { name: 'SES 122S' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vesta Multi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aries.3' })).toBeInTheDocument();
  });

  it('filters by gauge, hiding models that have no unit of that gauge', async () => {
    renderPage(<MachinesPage />);
    await screen.findByRole('heading', { name: 'SES 122S' });

    const gaugeGroup = screen.getByRole('group', { name: es.mpage.filterGauge });
    fireEvent.click(within(gaugeGroup).getByRole('button', { name: '10' }));

    expect(screen.getByRole('heading', { name: 'Vesta Multi' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'SES 122S' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Aries.3' })).not.toBeInTheDocument();
  });

  it('seeds the brand filter from ?brand=', async () => {
    renderPage(<MachinesPage />, '/maquinas?brand=Shima%20Seiki');

    expect(await screen.findByRole('heading', { name: 'SES 122S' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vesta Multi' })).not.toBeInTheDocument();
  });

  it('shows a named empty state when a ?brand= filter matches no stock', async () => {
    renderPage(<MachinesPage />, '/maquinas?brand=Protti');

    await waitFor(() => expect(screen.getByText(/Protti/)).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Vesta Multi' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: es.mpage.viewAll }));
    expect(screen.getByRole('heading', { name: 'Vesta Multi' })).toBeInTheDocument();
  });

  it('shows the unavailable state with a WhatsApp link, and no stale stock, when the catalog fails', async () => {
    mockGetCatalog.mockRejectedValue(new Error('network'));
    renderPage(<MachinesPage />);

    expect(await screen.findByText(es.mpage.downTitle)).toBeInTheDocument();
    const wa = screen.getByRole('link', { name: es.mpage.downWhatsapp });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(screen.queryByRole('heading', { name: 'Vesta Multi' })).not.toBeInTheDocument();

    fireEvent.click(wa);
    expect(mockTrack).toHaveBeenCalledWith('click_whatsapp', { source: 'catalog_unavailable' });
  });

  it('shows the empty state when nothing is in stock', async () => {
    mockGetCatalog.mockResolvedValue([]);
    renderPage(<MachinesPage />);

    expect(await screen.findByText(es.mpage.emptyTitle)).toBeInTheDocument();
  });
});
