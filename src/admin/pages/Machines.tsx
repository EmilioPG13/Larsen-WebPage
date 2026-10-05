import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
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

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-600">Cargando máquinas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Máquinas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Las unidades disponibles se administran en Inventario. Aquí solo se marca qué modelos se venden bajo pedido.
        </p>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Máquina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bajo pedido
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {machines.map((machine) => (
                <tr key={machine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{machine.name}</div>
                    <div className="text-sm text-gray-500">{machine.description.substring(0, 50)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{machine.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <label className="inline-flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={machine.onOrder ?? false}
                        disabled={savingId === machine.id}
                        onChange={(e) => handleOnOrderChange(machine, e.target.checked)}
                        aria-label={`${machine.name} se vende bajo pedido`}
                        className="h-4 w-4 rounded border-gray-300"
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
    </div>
  );
};

export default Machines;
