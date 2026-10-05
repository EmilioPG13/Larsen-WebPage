import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { PageError, PageHeader, PageLoading, Panel, Tag, type MarkName } from '../components/ui/kit';

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
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al cargar leads'));
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
    } catch (err) {
      alert('Error al actualizar estado: ' + apiErrorMessage(err, err instanceof Error ? err.message : ''));
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`¿Eliminar el lead de ${lead.name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await adminApi.deleteLead(lead.id);
      setSelectedLead(null);
      await fetchLeads();
    } catch (err) {
      alert('Error al eliminar lead: ' + apiErrorMessage(err, err instanceof Error ? err.message : ''));
    }
  };

  const statusOptions = ['new', 'contacted', 'converted', 'archived'];
  const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    converted: 'Convertido',
    archived: 'Archivado',
  };

  const statusMarks: Record<string, MarkName> = {
    new: 'sq',
    contacted: 'sqslash',
    converted: 'sqcheck',
    archived: 'sqdash',
  };
  const statusTones: Record<string, 'solid' | 'navy' | 'plain'> = {
    new: 'solid',
    contacted: 'navy',
    converted: 'navy',
    archived: 'plain',
  };

  if (loading) return <PageLoading>Cargando leads...</PageLoading>;
  if (error) return <PageError>{error}</PageError>;

  const Detail: React.FC<{ term: string; children: React.ReactNode }> = ({ term, children }) => (
    <>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </>
  );

  return (
    <div className="adm-page">
      <PageHeader
        title="Gestión de Leads"
        actions={
          <div className="w-full sm:w-56">
            <label htmlFor="lead-status-filter" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="lead-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adm-input"
            >
              <option value="all">Todos los estados</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Leads List */}
        <div className="adm-panel self-start overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Contacto</th>
                <th scope="col">Empresa</th>
                <th scope="col">Estado</th>
                <th scope="col">Fecha</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} data-selected={selectedLead?.id === lead.id}>
                  <td className="whitespace-nowrap">
                    <div className="font-semibold text-a-ink">{lead.name}</div>
                    <div className="text-[13px] text-a-text2">{lead.email}</div>
                    <div className="adm-num text-[13px] text-a-muted">{lead.phone}</div>
                  </td>
                  <td className="whitespace-nowrap text-a-text2">{lead.company}</td>
                  <td className="whitespace-nowrap">
                    <Tag mark={statusMarks[lead.status] ?? 'sqdash'} tone={statusTones[lead.status] ?? 'plain'}>
                      {statusLabels[lead.status] || lead.status}
                    </Tag>
                  </td>
                  <td className="adm-num whitespace-nowrap text-[13px] text-a-text2">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => setSelectedLead(lead)} className="adm-link adm-brackets">
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead Details Sidebar */}
        <div>
          {selectedLead ? (
            <Panel title="Detalles del Lead">
              <dl className="adm-detail m-0">
                <Detail term="Nombre">{selectedLead.name}</Detail>
                <Detail term="Email">{selectedLead.email}</Detail>
                <Detail term="Teléfono">
                  <span className="adm-num">{selectedLead.phone}</span>
                </Detail>
                <Detail term="Empresa">{selectedLead.company}</Detail>
                {selectedLead.industry && <Detail term="Industria">{selectedLead.industry}</Detail>}
                <Detail term="Presupuesto">{selectedLead.budget}</Detail>
                <Detail term="Fecha de compra">{selectedLead.purchaseDate}</Detail>
                {selectedLead.message && <Detail term="Mensaje">{selectedLead.message}</Detail>}
              </dl>

              <div className="mb-4 border-t border-a-line pt-4">
                <label htmlFor="lead-status" className="adm-field-label">
                  Cambiar Estado
                </label>
                <select
                  id="lead-status"
                  value={selectedLead.status}
                  onChange={(e) => handleStatusUpdate(selectedLead.id, e.target.value)}
                  className="adm-input"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => handleDelete(selectedLead)} className="adm-btn adm-btn-danger adm-btn-block">
                  Eliminar lead
                </button>
                <button onClick={() => setSelectedLead(null)} className="adm-btn adm-btn-block">
                  Cerrar
                </button>
              </div>
            </Panel>
          ) : (
            <div className="adm-panel p-6 text-center text-a-muted">Selecciona un lead para ver sus detalles</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leads;
