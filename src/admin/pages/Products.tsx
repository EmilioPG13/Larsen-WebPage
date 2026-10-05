import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import InventoryManager from '../components/InventoryManager';
import { PageError, PageHeader, PageLoading, Tag } from '../components/ui/kit';
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
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al cargar productos'));
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    try {
      await adminApi.updateProductStock(id, data);
      await fetchProducts(); // Refresh list
      setSelectedProduct(null);
    } catch (err) {
      alert('Error al actualizar inventario: ' + apiErrorMessage(err, err instanceof Error ? err.message : ''));
    }
  };

  if (loading) return <PageLoading>Cargando productos...</PageLoading>;
  if (error) return <PageError>{error}</PageError>;

  return (
    <div className="adm-page">
      <PageHeader title="Gestión de Productos" />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Products List */}
        <div className="adm-panel self-start overflow-x-auto">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} data-selected={selectedProduct?.id === product.id}>
                  <td className="whitespace-nowrap">
                    <div className="font-semibold text-a-ink">{product.name}</div>
                    <div className="text-[13px] text-a-muted">{product.description.substring(0, 50)}...</div>
                  </td>
                  <td className="whitespace-nowrap text-a-text2">{product.category}</td>
                  <td className="whitespace-nowrap">
                    <Tag mark={product.inStock ? 'ring' : 'cross'} tone={product.inStock ? 'navy' : 'plain'}>
                      {product.inStock ? 'En Stock' : 'No disponible'}
                    </Tag>
                  </td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => setSelectedProduct(product)} className="adm-link adm-brackets">
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inventory Manager Sidebar */}
        <div>
          {selectedProduct ? (
            <div>
              <h2 className="m-0 mb-3 text-[18px] font-semibold text-a-ink">{selectedProduct.name}</h2>
              <InventoryManager
                currentStock={selectedProduct.inStock ?? true}
                onUpdate={(data) => handleStockUpdate(selectedProduct.id, data)}
                type="product"
              />
              <button onClick={() => setSelectedProduct(null)} className="adm-btn adm-btn-block mt-3">
                Cerrar
              </button>
            </div>
          ) : (
            <div className="adm-panel p-6 text-center text-a-muted">
              Selecciona un producto para gestionar su inventario
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
