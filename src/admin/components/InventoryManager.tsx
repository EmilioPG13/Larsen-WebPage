import React, { useState } from 'react';

interface InventoryManagerProps {
  currentStock: boolean;
  onUpdate: (data: { inStock?: boolean; quantity?: number }) => Promise<void>;
  type: 'product' | 'machine';
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
  currentStock,
  onUpdate,
  type: _type,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [quantity, setQuantity] = useState<number>(currentStock ? 1 : 0);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onUpdate({ inStock: !currentStock });
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate({ quantity });
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Gestión de Inventario
      </h3>

      {/* Current Status */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado Actual:
        </label>
        <div
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${currentStock
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
            }`}
        >
          {currentStock ? '✓ En Stock' : '✗ No disponible'}
        </div>
      </div>

      {/* Quick Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cambio Rápido:
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentStock
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUpdating
              ? 'Actualizando...'
              : currentStock
                ? 'Marcar como No disponible'
                : 'Marcar como En Stock'}
          </button>
        </div>
      </div>

      {/* Quantity Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          O usar cantidad:
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent w-24"
            placeholder="Cantidad"
          />
          <button
            onClick={handleQuantityUpdate}
            disabled={isUpdating}
            className="px-4 py-2 bg-larsen-blue text-white rounded-lg font-medium hover:bg-larsen-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Cantidad &gt; 0 = En Stock, Cantidad = 0 = No disponible
        </p>
      </div>
    </div>
  );
};

export default InventoryManager;


