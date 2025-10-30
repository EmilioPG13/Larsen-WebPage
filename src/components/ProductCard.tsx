import React from 'react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onInterest: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onInterest }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-gray-200">
      {/* Product Image - White background */}
      <div className="relative h-72 bg-white overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-8"
        />
        
        {/* Discount badge */}
        {product.discount && (
          <div className="absolute top-4 left-4 bg-larsen-red text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-md">
            {product.discount}
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-md">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6 bg-gradient-to-b from-white to-gray-50">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-larsen-red transition-colors">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Features - Compact layout */}
        <div className="mb-5">
          <ul className="text-sm text-gray-700 space-y-1.5">
            {product.features.slice(0, 2).map((feature, index) => (
              <li key={index} className="flex items-center">
                <div className="w-1.5 h-1.5 bg-larsen-red rounded-full mr-2.5 flex-shrink-0"></div>
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price and CTA */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-gray-900">
              {product.price}
            </p>
            <button
              onClick={() => onInterest(product)}
              className="bg-larsen-red text-white font-semibold px-6 py-2.5 rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 hover:brightness-110 text-sm whitespace-nowrap"
            >
              💬 Me interesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
