import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractiveQuoteForm from '../components/InteractiveQuoteForm';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  submitLead: vi.fn(),
}));

describe('InteractiveQuoteForm', () => {
  const mockSubmitLead = vi.mocked(api.submitLead);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Navigation', () => {
    it('should start at step 1', () => {
      render(<InteractiveQuoteForm />);
      expect(screen.getByText('Paso 1 de 6')).toBeInTheDocument();
      expect(screen.getByText('Información Personal')).toBeInTheDocument();
    });

    it('should not allow proceeding from step 1 without required fields', () => {
      render(<InteractiveQuoteForm />);
      const nextButton = screen.getByText('Siguiente →');
      expect(nextButton).toBeDisabled();
    });

    it('should allow proceeding when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<InteractiveQuoteForm />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');

      const nextButton = screen.getByText('Siguiente →');
      expect(nextButton).not.toBeDisabled();
    });

    it('should navigate to next step when valid', async () => {
      const user = userEvent.setup();
      render(<InteractiveQuoteForm />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');

      const nextButton = screen.getByText('Siguiente →');
      await user.click(nextButton);

      expect(screen.getByText('Paso 2 de 6')).toBeInTheDocument();
      expect(screen.getByText('Tipo de Industria')).toBeInTheDocument();
    });

    it('should navigate back to previous step', async () => {
      const user = userEvent.setup();
      render(<InteractiveQuoteForm />);

      // Fill step 1 and proceed
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));

      // Go back
      const backButton = screen.getByText('← Anterior');
      await user.click(backButton);

      expect(screen.getByText('Paso 1 de 6')).toBeInTheDocument();
    });

    it('should disable back button on first step', () => {
      render(<InteractiveQuoteForm />);
      const backButton = screen.getByText('← Anterior');
      expect(backButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<InteractiveQuoteForm />);

      const emailInput = screen.getByLabelText(/correo electrónico/i);
      await user.type(emailInput, 'invalid-email');

      // HTML5 validation should prevent invalid email
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should require budget selection in step 4', async () => {
      const user = userEvent.setup();
      render(<InteractiveQuoteForm />);

      // Fill step 1
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));

      // Skip step 2 (optional)
      await user.click(screen.getByText('Siguiente →'));

      // Skip step 3 (optional)
      await user.click(screen.getByText('Siguiente →'));

      // Step 4 - budget required
      const nextButton = screen.getByText('Siguiente →');
      expect(nextButton).toBeDisabled();
    });

    it('should require purchase date selection in step 5', async () => {
      const user = userEvent.setup();
      render(<InteractiveQuoteForm />);

      // Fill step 1
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));

      // Skip step 2
      await user.click(screen.getByText('Siguiente →'));

      // Skip step 3
      await user.click(screen.getByText('Siguiente →'));

      // Select budget
      const budgetOption = screen.getByText('$25,000 - $50,000');
      await user.click(budgetOption);
      await user.click(screen.getByText('Siguiente →'));

      // Step 5 - purchase date required
      const nextButton = screen.getByText('Siguiente →');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with all required fields', async () => {
      const user = userEvent.setup();
      mockSubmitLead.mockResolvedValue({ id: '1', status: 'new' });

      render(<InteractiveQuoteForm />);

      // Fill all steps
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));

      // Step 2 - optional, skip
      await user.click(screen.getByText('Siguiente →'));

      // Step 3 - optional, skip
      await user.click(screen.getByText('Siguiente →'));

      // Step 4 - select budget
      const budgetOption = screen.getByText('$25,000 - $50,000');
      await user.click(budgetOption);
      await user.click(screen.getByText('Siguiente →'));

      // Step 5 - select purchase date
      const purchaseDateOption = screen.getByText('1-3 meses');
      await user.click(purchaseDateOption);
      await user.click(screen.getByText('Siguiente →'));

      // Step 6 - submit
      const submitButton = screen.getByText('Enviar Solicitud');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitLead).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          company: 'Test Company',
          budget: '$25,000 - $50,000',
          purchaseDate: '1-3 meses',
        });
      });
    });

    it('should show success message after submission', async () => {
      const user = userEvent.setup();
      mockSubmitLead.mockResolvedValue({ id: '1', status: 'new' });

      render(<InteractiveQuoteForm />);

      // Fill and submit form (simplified for this test)
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('$25,000 - $50,000'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('1-3 meses'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Enviar Solicitud'));

      await waitFor(() => {
        expect(screen.getByText('¡Solicitud Enviada!')).toBeInTheDocument();
      });
    });

    it('should show error message on submission failure', async () => {
      const user = userEvent.setup();
      mockSubmitLead.mockRejectedValue(new Error('Network Error'));

      render(<InteractiveQuoteForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('$25,000 - $50,000'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('1-3 meses'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Enviar Solicitud'));

      await waitFor(() => {
        expect(screen.getByText(/error al enviar la solicitud/i)).toBeInTheDocument();
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      mockSubmitLead.mockResolvedValue({ id: '1', status: 'new' });

      render(<InteractiveQuoteForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('$25,000 - $50,000'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('1-3 meses'));
      await user.click(screen.getByText('Siguiente →'));
      await user.click(screen.getByText('Enviar Solicitud'));

      // Wait for success message, then wait for reset (3 seconds)
      await waitFor(() => {
        expect(screen.getByText('¡Solicitud Enviada!')).toBeInTheDocument();
      });

      // After reset, form should be back to step 1
      await waitFor(
        () => {
          expect(screen.getByText('Paso 1 de 6')).toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });
  });

  describe('Optional Fields', () => {
    it('should submit form without optional fields', async () => {
      const user = userEvent.setup();
      mockSubmitLead.mockResolvedValue({ id: '1', status: 'new' });

      render(<InteractiveQuoteForm />);

      // Fill only required fields
      await user.type(screen.getByLabelText(/nombre completo/i), 'John Doe');
      await user.type(screen.getByLabelText(/correo electrónico/i), 'john@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '+1 (555) 123-4567');
      await user.type(screen.getByLabelText(/empresa/i), 'Test Company');
      await user.click(screen.getByText('Siguiente →'));

      // Skip optional industry
      await user.click(screen.getByText('Siguiente →'));

      // Skip optional production volume
      await user.click(screen.getByText('Siguiente →'));

      // Select required budget
      await user.click(screen.getByText('$25,000 - $50,000'));
      await user.click(screen.getByText('Siguiente →'));

      // Select required purchase date
      await user.click(screen.getByText('1-3 meses'));
      await user.click(screen.getByText('Siguiente →'));

      // Skip optional message and submit
      await user.click(screen.getByText('Enviar Solicitud'));

      await waitFor(() => {
        expect(mockSubmitLead).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          company: 'Test Company',
          budget: '$25,000 - $50,000',
          purchaseDate: '1-3 meses',
        });
      });
    });
  });
});

