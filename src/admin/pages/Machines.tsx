import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { Alert, PageError, PageHeader, PageLoading } from '../components/ui/kit';
import { apiErrorMessage } from '../services/apiError';
import type { Machine } from '../../types';

/**
 * Spec sheets of the machines. Stock no longer lives here: it comes from the
 * physical units in Inventario. The only commercial flag left on a sheet is
 * whether the model is sold to order from Italy (Aries), which the public
 * catalog lists without units.
 */
const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMachines();
      setMachines(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al cargar máquinas'));
    } finally {
      setLoading(false);
    }
  };

  const handleOnOrderChange = async (machine: Machine, onOrder: boolean) => {
    setActionError('');
    setSavingId(machine.id);
    try {
      const updated = await adminApi.updateMachine(machine.id, { onOrder });
      setMachines((prev) => prev.map((m) => (m.id === machine.id ? { ...m, onOrder: updated.onOrder ?? onOrder } : m)));
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Error al actualizar la máquina'));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <PageLoading>Cargando máquinas...</PageLoading>;
  if (error) return <PageError>{error}</PageError>;

  return (
    <div className="adm-page">
      <PageHeader
        title="Gestión de Máquinas"
        subtitle="Las unidades disponibles se administran en Inventario. Aquí solo se marca qué modelos se venden bajo pedido."
      />

      {actionError && <Alert>{actionError}</Alert>}

      <div className="adm-panel overflow-x-auto">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Máquina</th>
              <th scope="col">Marca</th>
              <th scope="col">Bajo pedido</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id}>
                <td>
                  <div className="font-semibold text-a-ink">{machine.name}</div>
                  <div className="text-[13px] text-a-muted">{machine.description.substring(0, 50)}...</div>
                </td>
                <td className="whitespace-nowrap text-a-text2">{machine.brand}</td>
                <td className="whitespace-nowrap">
                  <label className="inline-flex min-h-8 items-center gap-2.5 text-a-text2">
                    <input
                      type="checkbox"
                      checked={machine.onOrder ?? false}
                      disabled={savingId === machine.id}
                      onChange={(e) => handleOnOrderChange(machine, e.target.checked)}
                      aria-label={`${machine.name} se vende bajo pedido`}
                      className="adm-check"
                    />
                    Se vende bajo pedido
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Machines;
