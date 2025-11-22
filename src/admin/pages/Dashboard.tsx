import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface Stats {
  leads: {
    total: number;
    newToday: number;
  };
  products: {
    total: number;
    inStock: number;
    outOfStock: number;
  };
  machines: {
    total: number;
    inStock: number;
    outOfStock: number;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando estadísticas...</div>
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

  if (!stats) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Leads Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.leads.total}</p>
          <p className="text-sm text-gray-600 mt-2">
            Nuevos hoy: <span className="font-semibold">{stats.leads.newToday}</span>
          </p>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Productos</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.products.total}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600">
              En Stock: <span className="font-semibold">{stats.products.inStock}</span>
            </span>
            <span className="text-gray-600">
              Sin Stock: <span className="font-semibold">{stats.products.outOfStock}</span>
            </span>
          </div>
        </div>

        {/* Machines Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Máquinas</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.machines.total}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-600">
              En Stock: <span className="font-semibold">{stats.machines.inStock}</span>
            </span>
            <span className="text-gray-600">
              Sin Stock: <span className="font-semibold">{stats.machines.outOfStock}</span>
            </span>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Inventario Total</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.products.inStock + stats.machines.inStock}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Artículos disponibles
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


