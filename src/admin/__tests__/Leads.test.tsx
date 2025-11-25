import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Leads from '../pages/Leads';
import * as adminApi from '../services/adminApi';

// Mock the admin API
vi.mock('../services/adminApi', () => ({
  adminApi: {
    getLeads: vi.fn(),
    updateLeadStatus: vi.fn(),
  },
}));

const mockAdminApi = adminApi.adminApi as any;

describe('Leads Page', () => {
  const mockLeads = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Test Company',
      industry: 'Textil y Confección',
      budget: '$25,000 - $50,000',
      purchaseDate: '1-3 meses',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 987-6543',
      company: 'Another Company',
      status: 'contacted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminApi.getLeads.mockResolvedValue({ leads: mockLeads });
    mockAdminApi.updateLeadStatus.mockResolvedValue({ ...mockLeads[0], status: 'contacted' });
  });

  it('should display loading state initially', () => {
    mockAdminApi.getLeads.mockImplementation(() => new Promise(() => {}));
    render(<Leads />);
    expect(screen.getByText('Cargando leads...')).toBeInTheDocument();
  });

  it('should display leads list after loading', async () => {
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('should display lead details when "Ver detalles" is clicked', async () => {
    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByText('Ver detalles')[0];
    await user.click(viewButton);

    expect(screen.getByText('Detalles del Lead')).toBeInTheDocument();
    // Use getAllByText since John Doe appears in both table and sidebar
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0);
    // Email also appears in both table and sidebar
    const emailElements = screen.getAllByText('john@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });

  it('should filter leads by status', async () => {
    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('Todos los estados');
    await user.selectOptions(filterSelect, 'new');

    await waitFor(() => {
      expect(mockAdminApi.getLeads).toHaveBeenCalledWith({ status: 'new' });
    });
  });

  it('should update lead status', async () => {
    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click to view details
    const viewButton = screen.getAllByText('Ver detalles')[0];
    await user.click(viewButton);

    // Change status
    const statusSelect = screen.getByDisplayValue('Nuevo');
    await user.selectOptions(statusSelect, 'contacted');

    await waitFor(() => {
      expect(mockAdminApi.updateLeadStatus).toHaveBeenCalledWith('1', 'contacted');
    });
  });

  it('should display error message on fetch failure', async () => {
    mockAdminApi.getLeads.mockRejectedValue({
      response: { data: { error: 'Failed to fetch leads' } },
    });

    render(<Leads />);

    await waitFor(() => {
      // The component shows the error from response.data.error
      expect(screen.getByText('Failed to fetch leads')).toBeInTheDocument();
    });
  });

  it('should display empty state message when no leads selected', async () => {
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('Selecciona un lead para ver sus detalles')).toBeInTheDocument();
    });
  });

  it('should display all lead fields in details sidebar', async () => {
    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByText('Ver detalles')[0];
    await user.click(viewButton);

    // Use getAllByText since John Doe appears in both table and sidebar
    const johnDoeElements = screen.getAllByText('John Doe');
    expect(johnDoeElements.length).toBeGreaterThan(0);
    // Email also appears in both table and sidebar
    const emailElements = screen.getAllByText('john@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
    // Phone also appears in both table and sidebar
    const phoneElements = screen.getAllByText('+1 (555) 123-4567');
    expect(phoneElements.length).toBeGreaterThan(0);
    // Company also appears in both table and sidebar
    const companyElements = screen.getAllByText('Test Company');
    expect(companyElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Textil y Confección')).toBeInTheDocument();
    expect(screen.getByText('$25,000 - $50,000')).toBeInTheDocument();
    expect(screen.getByText('1-3 meses')).toBeInTheDocument();
  });

  it('should close details sidebar when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open details
    const viewButton = screen.getAllByText('Ver detalles')[0];
    await user.click(viewButton);

    expect(screen.getByText('Detalles del Lead')).toBeInTheDocument();

    // Close details
    const closeButton = screen.getByText('Cerrar');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Detalles del Lead')).not.toBeInTheDocument();
    });
  });
});

