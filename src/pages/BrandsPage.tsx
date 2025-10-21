import React from 'react';

interface Brand {
  name: string;
  image: string;
  description: string;
  specialties: string[];
}

const brands: Brand[] = [
  {
    name: "PROTTI",
    image: "/images/brands/PROTTI.png",
    description: "Máquinas industriales italianas de alta precisión",
    specialties: ["Máquinas de coser industriales", "Equipos de alta velocidad", "Tecnología italiana"]
  },
  {
    name: "Scheller",
    image: "/images/brands/Scheller.png",
    description: "Máquinas textiles de precisión alemana",
    specialties: ["Máquinas textiles", "Precisión alemana", "Innovación tecnológica"]
  },
  {
    name: "SHIMA SEIKI",
    image: "/images/brands/SHIMA SEIKI.png",
    description: "Líder mundial en máquinas de tejido japonesas",
    specialties: ["Máquinas de tejido", "Tecnología japonesa", "Automatización avanzada"]
  },
  {
    name: "Steiger ZAMARK",
    image: "/images/brands/Steiger ZAMARK.png",
    description: "Tecnología de costura avanzada y soluciones industriales",
    specialties: ["Costura industrial", "Soluciones automatizadas", "Equipos especializados"]
  },
  {
    name: "STOLL",
    image: "/images/brands/STOLL.png",
    description: "Máquinas de punto alemanas de última generación",
    specialties: ["Máquinas de punto", "Tecnología alemana", "Sistemas CAD/CAM"]
  }
];

const BrandsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-18 pb-5 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-larsen-blue rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-larsen-red rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-6 py-3 rounded-full text-sm font-semibold mb-6">
              🏭 MARCAS DE CONFIANZA
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Nuestras <span className="text-larsen-red">Marcas</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Trabajamos con las marcas más prestigiosas del mundo en maquinaria industrial, 
              garantizando calidad, innovación y rendimiento excepcional para nuestros clientes.
            </p>
          </div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {brands.map((brand, index) => (
              <div
                key={brand.name}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2"
              >
                {/* Logo Container */}
                <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                  />
                  {/* Overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-larsen-red transition-colors duration-300">
                    {brand.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {brand.description}
                  </p>
                  
                  {/* Specialties */}
                  <div className="space-y-2">
                    {brand.specialties.map((specialty, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-xs text-gray-500"
                      >
                        <span className="w-1.5 h-1.5 bg-larsen-red rounded-full mr-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                        {specialty}
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button className="mt-6 w-full bg-gray-100 hover:bg-larsen-red hover:text-white text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-300 text-sm">
                    Ver Productos
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-larsen-blue to-larsen-red">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            ¿Necesitas asesoría especializada?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Nuestro equipo de expertos te ayudará a elegir la marca y modelo perfecto 
            para tus necesidades industriales.
          </p>
          <button className="bg-white text-larsen-red font-semibold text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:brightness-105 hover:-translate-y-1">
            Contactar Especialista
          </button>
        </div>
      </section>
    </div>
  );
};

export default BrandsPage;
