import React, { useState } from 'react';
import type { Product } from '../types';

interface ProductCarouselProps {
  products: Product[];
  onProductInterest: (product: Product) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, onProductInterest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextProduct = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevProduct = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const currentProduct = products[currentIndex];

  // Get main specs from features
  const getMainSpecs = (features: string[]) => {
    const specs = [];
    
    // For knitting machines, prioritize speed and width
    if (features.length >= 1) {
      specs.push({ value: features[0], label: 'Velocidad' });
    }
    
    if (features.length >= 2) {
      specs.push({ value: features[1], label: 'Ancho' });
    }
    
    // If we don't have enough specs, add generic ones
    while (specs.length < 2) {
      if (specs.length === 0) {
        specs.push({ value: 'Premium', label: 'Calidad industrial' });
        specs.push({ value: '2 años', label: 'Garantía' });
      } else {
        specs.push({ value: '2 años', label: 'Garantía' });
      }
    }
    
    return specs.slice(0, 2);
  };

  const mainSpecs = getMainSpecs(currentProduct.features);

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 overflow-hidden">
        <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-12 text-center relative transition-all duration-500 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          
          {/* Navigation arrows */}
          <button
            onClick={prevProduct}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Producto anterior"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextProduct}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Siguiente producto"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Product image - larger, no distorsión */}
          <div className="w-64 h-64 bg-white rounded-xl shadow-lg flex items-center justify-center mx-auto mb-6 border-2 border-gray-200 p-4">
            <img
              src={currentProduct.image}
              alt={currentProduct.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentProduct.name}</h3>
          <p className="text-larsen-red font-semibold mb-2">Máquina Industrial Premium</p>
          
          {/* Specs */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
            {mainSpecs.map((spec, index) => (
              <div key={index} className="bg-white rounded-lg p-3">
                <div className="font-semibold text-gray-900">{spec.value}</div>
                <div>{spec.label}</div>
              </div>
            ))}
          </div>

            <button 
              onClick={() => onProductInterest(currentProduct)}
              className="bg-larsen-red text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-2 hover:brightness-110"
            >
              💬 Me interesa
            </button>

          {/* Product indicator dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsTransitioning(false), 500);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-larsen-red w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir al producto ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Badge with shine effect */}
        <div className="absolute -top-3 -right-3 group">
          <div className="relative bg-larsen-red text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg overflow-hidden cursor-pointer">
            <span className="relative z-10">⭐ NUEVO 2025</span>
            
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            {/* Additional glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-white/10 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;
