import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuotePage from '../QuotePage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { es } from '../../i18n/dictionary';
import type { Machine } from '../../types';
import * as api from '../../services/api';
import * as leads from '../../services/leads';
import * as analytics from '../../services/analytics';

vi.mock('../../services/api', () => ({ getMachines: vi.fn() }));
vi.mock('../../services/leads', () => ({ sendQuoteLead: vi.fn() }));
vi.mock('../../services/analytics', () => ({ track: vi.fn() }));

const mockGetMachines = vi.mocked(api.getMachines);
const mockSendQuoteLead = vi.mocked(leads.sendQuoteLead);
const mockTrack = vi.mocked(analytics.track);

const machine = (id: string, name: string): Machine => ({
  id,
  name,
  brand: 'Steiger',
  description: 'desc',
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

const machines = [machine('aries-3', 'Aries.3'), machine('vesta-multi', 'Vesta Multi')];

const renderAt = (path: string) =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <QuotePage />
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe('QuotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetMachines.mockResolvedValue(machines);
    mockSendQuoteLead.mockResolvedValue(undefined);
  });

  it('renders the form', async () => {
    renderAt('/cotizacion');
    expect(screen.getByRole('heading', { level: 1, name: es.qpage.t })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: es.qpage.submit })).toBeInTheDocument();
  });

  it('prefills the machine of interest from the ?machine= param', async () => {
    renderAt('/cotizacion?machine=Aries.3');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: es.qpage.machine })).toHaveValue('Aries.3'),
    );
  });

  describe('quote for one unit', () => {
    const unitPath = '/cotizacion?machine=Gemini&brand=Steiger&gauge=10&serial=7429&unit=u-7429';

    const fillAndSend = async () => {
      await screen.findByRole('button', { name: es.qpage.submit });
      fireEvent.change(screen.getByRole('textbox', { name: es.qpage.name }), { target: { value: 'Ana' } });
      fireEvent.change(screen.getByRole('textbox', { name: es.qpage.email }), { target: { value: 'ana@acme.com' } });
      fireEvent.change(screen.getByRole('textbox', { name: es.qpage.phone }), { target: { value: '5551234' } });
      fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));
      await waitFor(() => expect(screen.getByText(es.qpage.sentS)).toBeInTheDocument());
    };

    it('shows which unit the quote is for', async () => {
      renderAt(unitPath);

      expect(await screen.findByText(/Steiger Gemini · Serie 7429 · Galga 10/)).toBeInTheDocument();
    });

    it('sends the unit id, serial and source with the lead and tracks it', async () => {
      renderAt(unitPath);
      await fillAndSend();

      const sent = mockSendQuoteLead.mock.calls[0][0];
      expect(sent).toMatchObject({
        machine: 'Gemini',
        source: 'catalog-unit',
        serialNumber: '7429',
        inventoryUnitId: 'u-7429',
      });
      expect(sent.message).toContain('Unidad: 7429 (Galga 10)');
      expect(mockTrack).toHaveBeenCalledWith('submit_quote', {
        machine: 'Gemini',
        source: 'quote',
        brand: 'Steiger',
        model: 'Gemini',
        gauge: '10',
        serial_number: '7429',
      });
    });

    it('drops the unit when the visitor picks a different machine', async () => {
      renderAt(unitPath);
      await screen.findByRole('button', { name: es.qpage.submit });

      fireEvent.change(screen.getByRole('combobox', { name: es.qpage.machine }), { target: { value: 'Aries.3' } });
      expect(screen.queryByText(/Serie 7429/)).not.toBeInTheDocument();

      fireEvent.change(screen.getByRole('textbox', { name: es.qpage.name }), { target: { value: 'Ana' } });
      fireEvent.change(screen.getByRole('textbox', { name: es.qpage.email }), { target: { value: 'ana@acme.com' } });
      fireEvent.change(screen.getByRole('textbox', { name: es.qpage.phone }), { target: { value: '5551234' } });
      fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));
      await waitFor(() => expect(screen.getByText(es.qpage.sentS)).toBeInTheDocument());

      const sent = mockSendQuoteLead.mock.calls[0][0];
      expect(sent.source).toBe('quote-page');
      expect(sent).not.toHaveProperty('serialNumber');
      expect(sent).not.toHaveProperty('inventoryUnitId');
    });

    it('does not mention a unit on a plain quote', async () => {
      renderAt('/cotizacion?machine=Aries.3');
      await fillAndSend();

      const sent = mockSendQuoteLead.mock.calls[0][0];
      expect(sent).not.toHaveProperty('serialNumber');
      expect(sent.message).not.toContain('Unidad');
    });
  });

  it('validates required fields and email format on blur', async () => {
    renderAt('/cotizacion');
    await screen.findByRole('button', { name: es.qpage.submit });

    fireEvent.blur(screen.getByRole('textbox', { name: es.qpage.name }));
    expect(screen.getByText(es.qpage.req)).toBeInTheDocument();

    const email = screen.getByRole('textbox', { name: es.qpage.email });
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.blur(email);
    expect(screen.getByText(es.qpage.invalidEmail)).toBeInTheDocument();
  });

  it('sends the lead and shows the confirmation plate with a reference', async () => {
    renderAt('/cotizacion');
    await screen.findByRole('button', { name: es.qpage.submit });

    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.name }), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.email }), { target: { value: 'ana@acme.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.phone }), { target: { value: '5551234' } });
    fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));

    await waitFor(() => expect(screen.getByText(es.qpage.sentS)).toBeInTheDocument());
    expect(mockSendQuoteLead).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'quote-page', name: 'Ana', email: 'ana@acme.com' }),
    );
    expect(screen.getByText(/^REF/)).toBeInTheDocument();
  });

  it('silently accepts a honeypot hit without dispatching a lead', async () => {
    const { container } = renderAt('/cotizacion');
    await screen.findByRole('button', { name: es.qpage.submit });

    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.name }), { target: { value: 'Bot' } });
    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.email }), { target: { value: 'bot@x.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: es.qpage.phone }), { target: { value: '000' } });
    fireEvent.change(container.querySelector('input[name="website"]')!, { target: { value: 'filled' } });
    fireEvent.click(screen.getByRole('button', { name: es.qpage.submit }));

    await waitFor(() => expect(screen.getByText(es.qpage.sentS)).toBeInTheDocument());
    expect(mockSendQuoteLead).not.toHaveBeenCalled();
    expect(screen.queryByText(/^REF/)).not.toBeInTheDocument();
  });
});
