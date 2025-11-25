import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry?: string;
  productionVolume?: string;
  budget: string;
  purchaseDate: string;
  message?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await adminApi.getLeads(params);
      setLeads(data.leads || data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await adminApi.updateLeadStatus(id, status);
      await fetchLeads();
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, status });
      }
    } catch (err: any) {
      alert('Error al actualizar estado: ' + (err.response?.data?.error || err.message));
    }
  };

  const statusOptions = ['new', 'contacted', 'converted', 'archived'];
  const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    converted: 'Convertido',
    archived: 'Archivado',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    converted: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Leads</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red"
        >
          <option value="all">Todos los estados</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        <div className="text-sm text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[lead.status] || statusColors.archived
                          }`}
                        >
                          {statusLabels[lead.status] || lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-larsen-blue hover:text-larsen-red font-medium"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lead Details Sidebar */}
        <div className="lg:col-span-1">
          {selectedLead ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del Lead</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-gray-900">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Teléfono</label>
                  <p className="text-gray-900">{selectedLead.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Empresa</label>
                  <p className="text-gray-900">{selectedLead.company}</p>
                </div>
                {selectedLead.industry && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Industria</label>
                    <p className="text-gray-900">{selectedLead.industry}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Presupuesto</label>
                  <p className="text-gray-900">{selectedLead.budget}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de compra</label>
                  <p className="text-gray-900">{selectedLead.purchaseDate}</p>
                </div>
                {selectedLead.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mensaje</label>
                    <p className="text-gray-900">{selectedLead.message}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cambiar Estado
                </label>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusUpdate(selectedLead.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              Selecciona un lead para ver sus detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leads;

