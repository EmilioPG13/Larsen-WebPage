import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onProductInterest: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductInterest }) => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-6 py-3 rounded-full text-sm font-semibold mb-6">
            🏭 CATÁLOGO INDUSTRIAL 2024
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Nuestras <span className="text-larsen-red">Máquinas</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Descubre nuestra línea completa de máquinas industriales Larsen Italiana, 
            diseñadas para profesionales que buscan calidad y rendimiento excepcional.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span className="font-medium">Garantía 2 años</span>
            </div>
            <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <span className="font-medium">Soporte técnico 24/7</span>
            </div>
            <div className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              <span className="font-medium">Envío rapido</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onInterest={onProductInterest}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link 
            to="/maquinas"
            className="inline-block bg-larsen-red text-white font-semibold text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:brightness-105 hover:-translate-y-1"
          >
            Saber más
          </Link>
          <p className="text-gray-500 mt-4">
            Más de 60 años de experiencia en el sector textil
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
