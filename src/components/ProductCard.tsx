import React from 'react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onInterest: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onInterest }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-gray-100">
      {/* Product Image */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-56 flex items-center justify-center p-8">
          {/* Machine placeholder with better visual representation */}
          <div className="text-center">
            <div className="w-32 h-32 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4 border-2 border-gray-200">
              <div className="text-4xl opacity-70">
                {product.category === 'Industrial' && '🏭'}
                {product.category === 'Overlock' && '✂️'}
                {product.category === 'Recta' && '📏'}
                {product.category === 'Bordado' && '🎨'}
                {product.category === 'Corte' && '🔪'}
                {product.category === 'Planchado' && '🔥'}
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full">
              Imagen próximamente
            </div>
          </div>
        </div>
        
        {/* Discount badge */}
        {product.discount && (
          <div className="absolute top-4 left-4 bg-larsen-red text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-md">
            {product.discount}
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-lg text-xs font-medium shadow-sm">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-larsen-red transition-colors">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
          {product.description}
        </p>

        {/* Features */}
        <div className="mb-6">
          <ul className="text-sm text-gray-600 space-y-2">
            {product.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-1.5 h-1.5 bg-larsen-red rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {product.price}
            </p>
            <p className="text-xs text-gray-500">Consulta disponible</p>
          </div>
          <button
            onClick={() => onInterest(product)}
            className="bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            💬 Me interesa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
