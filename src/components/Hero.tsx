import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
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
                  <span className="text-green-600 font-bold">365</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Días de garantía</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔨</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Soporte técnico</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">🚚</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Envío rápido</p>
              </div>
            </div>
          </div>

          {/* Right content - Brands showcase */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Marcas de <span className="text-larsen-red">Confianza Mundial</span>
                </h3>
                <p className="text-gray-600">Trabajamos con los mejores fabricantes</p>
              </div>
              
              {/* Brands Grid - 3 arriba, 2 abajo centradas */}
              <div className="space-y-4 mb-8">
                {/* Primera fila: 3 marcas */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "PROTTI", image: "/images/brands/PROTTI.png" },
                    { name: "Scheller", image: "/images/brands/Scheller.png" },
                    { name: "SHIMA SEIKI", image: "/images/brands/SHIMA SEIKI.png" }
                  ].map((brand, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 flex items-center justify-center hover:shadow-lg transition-all duration-300 group border border-gray-200 hover:border-larsen-red"
                    >
                      <img
                        src={brand.image}
                        alt={brand.name}
                        className="max-w-full max-h-24 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Segunda fila: 2 marcas centradas */}
                <div className="flex justify-center gap-4">
                  {[
                    { name: "Steiger ZAMARK", image: "/images/brands/Steiger ZAMARK.png" },
                    { name: "STOLL", image: "/images/brands/STOLL.png" }
                  ].map((brand, index) => (
                    <div
                      key={index + 3}
                      className="w-full max-w-[calc(33.333%-0.667rem)] bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 flex items-center justify-center hover:shadow-lg transition-all duration-300 group border border-gray-200 hover:border-larsen-red"
                    >
                      <img
                        src={brand.image}
                        alt={brand.name}
                        className="max-w-full max-h-24 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* CTA Button */}
              <Link
                to="/marcas"
                className="block w-full bg-larsen-blue text-white font-semibold py-3 px-6 rounded-full text-center transition-all duration-300 hover:brightness-110 hover:shadow-lg"
              >
                Explorar Marcas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
