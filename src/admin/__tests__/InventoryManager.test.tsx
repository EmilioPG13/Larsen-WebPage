import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryManager from '../components/InventoryManager';

describe('InventoryManager', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display current stock status as "En Stock" when inStock is true', () => {
    render(
      <InventoryManager
        currentStock={true}
        onUpdate={mockOnUpdate}
        type="product"
      />
    );

    expect(screen.getByText('✓ En Stock')).toBeInTheDocument();
  });

  it('should display current stock status as "No disponible" when inStock is false', () => {
    render(
      <InventoryManager
        currentStock={false}
        onUpdate={mockOnUpdate}
        type="product"
      />
    );

    expect(screen.getByText('✗ No disponible')).toBeInTheDocument();
  });

  it('should toggle stock status when toggle button is clicked', async () => {
    const user = userEvent.setup();
    mockOnUpdate.mockResolvedValue({});

    render(
      <InventoryManager
        currentStock={true}
        onUpdate={mockOnUpdate}
        type="product"
      />
    );

    const toggleButton = screen.getByText('Marcar como No disponible');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({ inStock: false });
    });
  });

  it('should update stock using quantity input', async () => {
    const user = userEvent.setup();
    mockOnUpdate.mockResolvedValue({});

    render(
      <InventoryManager
        currentStock={true}
        onUpdate={mockOnUpdate}
        type="product"
      />
    );

    const quantityInput = screen.getByPlaceholderText('Cantidad');
    const updateButton = screen.getByText('Actualizar');

    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({ quantity: 5 });
    });
  });

  it('should set quantity to 0 when marking as out of stock', async () => {
    const user = userEvent.setup();
    mockOnUpdate.mockResolvedValue({});

    render(
      <InventoryManager
        currentStock={true}
        onUpdate={mockOnUpdate}
        type="machine"
      />
    );

    const quantityInput = screen.getByPlaceholderText('Cantidad');
    const updateButton = screen.getByText('Actualizar');

    await user.clear(quantityInput);
    await user.type(quantityInput, '0');
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({ quantity: 0 });
    });
  });

  it('should disable buttons while updating', async () => {
    const user = userEvent.setup();
    let resolveUpdate: () => void;
    const updatePromise = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    mockOnUpdate.mockReturnValue(updatePromise);

    render(
      <InventoryManager
        currentStock={true}
        onUpdate={mockOnUpdate}
        type="product"
      />
    );

    const toggleButton = screen.getByText('Marcar como No disponible');
    await user.click(toggleButton);

    // Button should show "Actualizando..." while updating
    await waitFor(() => {
      expect(screen.getByText('Actualizando...')).toBeInTheDocument();
    });

    // Resolve the update
    resolveUpdate!();
    await waitFor(() => {
      expect(screen.queryByText('Actualizando...')).not.toBeInTheDocument();
    });
  });

  it('should handle update errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnUpdate.mockRejectedValue(new Error('Update failed'));

    render(
      <InventoryManager
        currentStock={true}
        onUpdate={mockOnUpdate}
        type="product"
      />
    );

    const toggleButton = screen.getByText('Marcar como No disponible');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

