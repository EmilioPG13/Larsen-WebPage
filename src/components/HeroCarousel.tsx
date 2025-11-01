import React, { useState } from 'react';
import type { Product } from '../types';

interface HeroCarouselProps {
  products: Product[];
  onProductInterest: (product: Product) => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ products, onProductInterest }) => {
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

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        {/* Header - Title left, Navigation right */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-4 py-2 rounded-full text-xs font-semibold mb-3">
              🏭 CATÁLOGO INDUSTRIAL 2025
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Nuestras <span className="text-larsen-red">Máquinas</span>
            </h2>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevProduct}
              disabled={isTransitioning}
              className="w-12 h-12 bg-white border-2 border-gray-300 hover:border-larsen-red hover:bg-larsen-red hover:text-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Producto anterior"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextProduct}
              disabled={isTransitioning}
              className="w-12 h-12 bg-white border-2 border-gray-300 hover:border-larsen-red hover:bg-larsen-red hover:text-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Siguiente producto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Content */}
        <div className={`transition-all duration-500 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="grid lg:grid-cols-5 gap-0">
              {/* Left - Product Image (60% width) */}
              <div className="lg:col-span-3 relative bg-white flex items-center justify-center p-12 min-h-[500px]">
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="max-w-full max-h-[450px] object-contain"
                />
                
                {/* Discount badge */}
                {currentProduct.discount && (
                  <div className="absolute top-6 left-6 bg-larsen-red text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                    {currentProduct.discount}
                  </div>
                )}
                
                {/* Category badge */}
                <div className="absolute top-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {currentProduct.category}
                </div>
              </div>

              {/* Right - Product Info (40% width) */}
              <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {currentProduct.name}
                </h3>
                
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  {currentProduct.description}
                </p>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {currentProduct.features.slice(0, 2).map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-larsen-red rounded-full mr-3 flex-shrink-0"></div>
                        <span className="font-semibold text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price and CTA */}
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {currentProduct.price}
                  </p>
                  <button
                    onClick={() => onProductInterest(currentProduct)}
                    className="w-full bg-larsen-red text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:brightness-110 hover:scale-105 text-lg"
                  >
                    💬 Me interesa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
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
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-larsen-red w-8' 
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
              aria-label={`Ir al producto ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;

