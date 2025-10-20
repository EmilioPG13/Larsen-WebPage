import React from 'react';
import SeasonalOffer from './SeasonalOffer';
import ProductCarousel from './ProductCarousel';
import type { Product } from '../types';
import productsData from '../data/products.json';

interface HeroProps {
  onProductInterest: (product: Product) => void;
}

const Hero: React.FC<HeroProps> = ({ onProductInterest }) => {
  return (
    <section className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-larsen-blue rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-larsen-red rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Main headline */}
            <div className="space-y-6">
              <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-4 py-2 rounded-full text-sm font-semibold">
                🏭 Máquinas Industriales Premium
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Coser es 
                <span className="text-larsen-red"> fácil</span>
                <span className="text-2xl align-top">™</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Descubre la línea completa de <strong>máquinas industriales Larsen Italiana</strong>, 
                diseñadas para profesionales que buscan calidad y rendimiento excepcional.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 py-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Años de garantía</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">24/7</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Soporte técnico</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">🚚</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Envío gratuito</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
                Ver Catálogo Completo
              </button>
              <button className="border-2 border-larsen-blue text-larsen-blue hover:bg-larsen-blue hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200">
                Solicitar Cotización
              </button>
            </div>

            {/* Special offer */}
            <SeasonalOffer />
          </div>

          {/* Right content - Product showcase */}
          <div className="relative">
            <ProductCarousel 
              products={productsData as Product[]} 
              onProductInterest={onProductInterest}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
