import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { es } from '../../i18n/dictionary';
import type { Machine } from '../../types';
import * as api from '../../services/api';
import * as leads from '../../services/leads';

vi.mock('../../services/api', () => ({ getMachines: vi.fn() }));
vi.mock('../../services/leads', () => ({ sendQuoteLead: vi.fn() }));
vi.mock('../../services/analytics', () => ({ track: vi.fn() }));

const mockGetMachines = vi.mocked(api.getMachines);
const mockSendQuoteLead = vi.mocked(leads.sendQuoteLead);

const machine = (id: string, name: string): Machine => ({
  id,
  name,
  brand: 'Steiger',
  description: `${name} description`,
  type: 'Rectilínea',
  knittingSystems: '3',
  width: '52"',
  speed: '1.6 m/s',
  gauge: '5-16',
  yarnGuides: '16',
  capabilities: [],
  software: 'Logica',
  power: '380V',
  category: 'Tejido Rectilíneo',
  image: `/${id}.png`,
  inStock: true,
});

const machines = [machine('aries-3', 'Aries.3'), machine('aries-6', 'Aries.6')];

const renderPage = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetMachines.mockResolvedValue(machines);
    mockSendQuoteLead.mockResolvedValue(undefined);
  });

  it('renders one carousel tab per machine and switches the active slide', async () => {
    renderPage();
    const tablist = await screen.findByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 1, name: 'Aries.3' })).toBeInTheDocument();

    fireEvent.click(tabs[1]);

    expect(screen.getByRole('heading', { level: 1, name: 'Aries.6' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('tablist')).getAllByRole('tab')[1],
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('prefills the machine-of-interest select from the active slide', async () => {
    renderPage();
    await screen.findByRole('tablist');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: es.qpage.machine })).toHaveValue('Aries.3'),
    );
  });

  it('blocks submit and shows validation errors when required fields are empty', async () => {
    renderPage();
    await screen.findByRole('tablist');

    fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));

    await waitFor(() => expect(screen.getAllByText(es.qpage.req).length).toBeGreaterThan(0));
    expect(mockSendQuoteLead).not.toHaveBeenCalled();
  });

  it('submits a valid inline quote and shows the confirmation with a reference', async () => {
    renderPage();
    await screen.findByRole('tablist');

    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.name }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.email }), { target: { value: 'ana@acme.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.phone }), { target: { value: '5551234' } });
    fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));

    await waitFor(() => expect(screen.getByText(es.qpage.sentS)).toBeInTheDocument());
    expect(mockSendQuoteLead).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'home-quote', name: 'Ana' }),
    );
    expect(screen.getByText(/^REF/)).toBeInTheDocument();
  });

  it('accepts a honeypot hit without dispatching a lead', async () => {
    const { container } = renderPage();
    await screen.findByRole('tablist');

    fireEvent.change(container.querySelector('input[name="website"]')!, { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));

    await waitFor(() => expect(screen.getByText(es.qpage.sentS)).toBeInTheDocument());
    expect(mockSendQuoteLead).not.toHaveBeenCalled();
  });
});
