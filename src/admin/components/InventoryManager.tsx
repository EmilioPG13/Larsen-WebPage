import React, { useState } from 'react';
import { Mark } from './ui/kit';

interface InventoryManagerProps {
  currentStock: boolean;
  onUpdate: (data: { inStock?: boolean; quantity?: number }) => Promise<void>;
  type: 'product' | 'machine';
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ currentStock, onUpdate }) => {
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
    <section className="adm-panel">
      <div className="adm-panel-head">
        <h3 className="adm-panel-title">Gestión de Inventario</h3>
      </div>

      <div className="adm-panel-body space-y-6">
        {/* Current Status */}
        <div>
          <div className="adm-field-label">Estado Actual:</div>
          <span className={`adm-tag ${currentStock ? 'adm-tag-navy' : ''}`}>
            <Mark name={currentStock ? 'ring' : 'cross'} size={14} />
            {currentStock ? 'En Stock' : 'No disponible'}
          </span>
        </div>

        {/* Quick Toggle */}
        <div>
          <div className="adm-field-label">Cambio Rápido:</div>
          <button
            onClick={handleToggle}
            disabled={isUpdating}
            className={`adm-btn ${currentStock ? 'adm-btn-danger' : ''}`}
          >
            {isUpdating
              ? 'Actualizando...'
              : currentStock
                ? 'Marcar como No disponible'
                : 'Marcar como En Stock'}
          </button>
        </div>

        {/* Quantity Input */}
        <div>
          <label htmlFor="stock-quantity" className="adm-field-label">
            O usar cantidad:
          </label>
          <div className="flex gap-2">
            <input
              id="stock-quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="adm-input adm-num w-24"
              placeholder="Cantidad"
            />
            <button onClick={handleQuantityUpdate} disabled={isUpdating} className="adm-btn adm-btn-primary">
              {isUpdating ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
          <p className="adm-note mt-2">Cantidad &gt; 0 = En Stock, Cantidad = 0 = No disponible</p>
        </div>
      </div>
    </section>
  );
};

export default InventoryManager;
