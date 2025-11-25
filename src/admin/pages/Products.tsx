import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import InventoryManager from '../components/InventoryManager';
import type { Product } from '../../types';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    try {
      await adminApi.updateProductStock(id, data);
      await fetchProducts(); // Refresh list
      setSelectedProduct(null);
    } catch (err: any) {
      alert('Error al actualizar inventario: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando productos...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
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
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.inStock ? 'En Stock' : 'No disponible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedProduct(product)}
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
          {selectedProduct ? (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedProduct.name}
              </h2>
              <InventoryManager
                currentStock={selectedProduct.inStock ?? true}
                onUpdate={(data) => handleStockUpdate(selectedProduct.id, data)}
                type="product"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              Selecciona un producto para gestionar su inventario
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;

