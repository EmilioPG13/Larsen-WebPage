import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactModal from '../ContactModal';
import type { Product } from '../../types';
import * as leads from '../../services/leads';

vi.mock('../../services/leads', () => ({ sendQuoteLead: vi.fn() }));

const mockSendQuoteLead = vi.mocked(leads.sendQuoteLead);

const product = { id: 'aries-3', name: 'Aries.3' } as Product;

const fillAndSubmit = () => {
  fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Ana Pérez' } });
  fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '+52 55 1234 5678' } });
  fireEvent.change(screen.getByLabelText(/Empresa/), { target: { value: 'Textiles SA' } });
  fireEvent.change(screen.getByLabelText(/Mensaje/), { target: { value: 'Quiero precio' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
};

describe('ContactModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  it('sends the lead through sendQuoteLead with the catalog-interest source and machine name', async () => {
    mockSendQuoteLead.mockResolvedValue(undefined);
    render(<ContactModal isOpen onClose={vi.fn()} product={product} />);

    fillAndSubmit();

    await waitFor(() => expect(mockSendQuoteLead).toHaveBeenCalledTimes(1));
    expect(mockSendQuoteLead).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      company: 'Textiles SA',
      email: 'ana@example.com',
      phone: '+52 55 1234 5678',
      machine: 'Aries.3',
      message: 'Máquina de interés: Aries.3\nQuiero precio',
      source: 'catalog-interest',
    });
  });

  it('shows the success state after a successful submit', async () => {
    mockSendQuoteLead.mockResolvedValue(undefined);
    render(<ContactModal isOpen onClose={vi.fn()} product={product} />);

    fillAndSubmit();

    expect(await screen.findByText(/Mensaje enviado/)).toBeInTheDocument();
  });

  it('shows the error state when sendQuoteLead rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSendQuoteLead.mockRejectedValue(new Error('boom'));
    render(<ContactModal isOpen onClose={vi.fn()} product={product} />);

    fillAndSubmit();

    expect(await screen.findByText(/Error al enviar el mensaje/)).toBeInTheDocument();
    expect(screen.queryByText(/Mensaje enviado/)).not.toBeInTheDocument();
  });
});
