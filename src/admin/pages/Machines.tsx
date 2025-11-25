import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import InventoryManager from '../components/InventoryManager';
import type { Machine } from '../../types';

const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMachines();
      setMachines(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar máquinas');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    try {
      await adminApi.updateMachineStock(id, data);
      await fetchMachines(); // Refresh list
      setSelectedMachine(null);
    } catch (err: any) {
      alert('Error al actualizar inventario: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando máquinas...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Máquinas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Machines List */}
        <div className="lg:col-span-2">
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
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {machines.map((machine) => (
                    <tr key={machine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{machine.name}</div>
                        <div className="text-sm text-gray-500">{machine.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {machine.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            machine.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {machine.inStock ? 'En Stock' : 'No disponible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedMachine(machine)}
                          className="text-larsen-blue hover:text-larsen-red font-medium"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inventory Manager Sidebar */}
        <div className="lg:col-span-1">
          {selectedMachine ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedMachine.name}
              </h2>
              <InventoryManager
                currentStock={selectedMachine.inStock ?? true}
                onUpdate={(data) => handleStockUpdate(selectedMachine.id, data)}
                type="machine"
              />
              <button
                onClick={() => setSelectedMachine(null)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              Selecciona una máquina para gestionar su inventario
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Machines;

