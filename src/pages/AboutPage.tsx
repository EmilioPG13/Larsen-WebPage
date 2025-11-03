import React from 'react';
import { Link } from 'react-router-dom';
import ImagePlaceholder from '../components/ImagePlaceholder';

const AboutPage: React.FC = () => {
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
              🏭 DESDE 1964
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Nuestra <span className="text-larsen-red">Historia</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Larsen Italiana comenzó en 1964 de la mano de su fundador, el Sr. Larsen Dick Eduard, 
              de origen sueco. Desde entonces, hemos sido líderes en reacondicionamiento de máquinas 
              de tejer de segunda mano.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-16">
              Nuestro <span className="text-larsen-red">Recorrido</span>
            </h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-larsen-red via-larsen-blue to-larsen-red hidden lg:block"></div>
              
              {/* Timeline items */}
              <div className="space-y-12">
                {/* 1964 - Fundación */}
                <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-larsen-red/20">
                      <div className="inline-block bg-larsen-red text-white px-4 py-2 rounded-full font-bold mb-4">
                        1964
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Fundación</h3>
                      <p className="text-gray-600 leading-relaxed">
                        El Sr. Larsen Dick Eduard, de origen sueco, funda Larsen Italiana 
                        con la visión de ofrecer máquinas de tejer de segunda mano de la más alta calidad.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:block"></div>
                  
                  {/* Center dot */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-larsen-red rounded-full border-4 border-white shadow-lg hidden lg:block"></div>
                </div>

                {/* Desarrollo */}
                <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                  <div className="hidden lg:block"></div>
                  <div className="lg:pl-12">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-larsen-blue/20">
                      <div className="inline-block bg-larsen-blue text-white px-4 py-2 rounded-full font-bold mb-4">
                        Desarrollo
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Crecimiento Continuo</h3>
                      <p className="text-gray-600 leading-relaxed">
                        La empresa desarrolla e incrementa sus actividades, estableciendo relaciones 
                        duraderas con las mejores marcas del mercado textil internacional.
                      </p>
                    </div>
                  </div>
                  
                  {/* Center dot */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-larsen-blue rounded-full border-4 border-white shadow-lg hidden lg:block"></div>
                </div>

                {/* Actualidad */}
                <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                  <div className="lg:text-right lg:pr-12">
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-larsen-red/20">
                      <div className="inline-block bg-gradient-to-r from-larsen-red to-larsen-blue text-white px-4 py-2 rounded-full font-bold mb-4">
                        Hoy
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Presencia Internacional</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Larsen Italiana es reconocida mundialmente por su excelencia en reacondicionamiento 
                        y actualización de máquinas de tejer, sirviendo tanto al mercado italiano como internacional.
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:block"></div>
                  
                  {/* Center dot */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-larsen-red to-larsen-blue rounded-full border-4 border-white shadow-lg hidden lg:block"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lo Que Hacemos Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Lo Que <span className="text-larsen-red">Hacemos</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nuestra organización comienza con la compra de máquinas de segunda mano de las mejores 
              marcas en el mercado mundial y su transporte a nuestra unidad de producción principal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Card 1 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2 border-t-4 border-larsen-red">
              <div className="w-16 h-16 bg-gradient-to-br from-larsen-red to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Evaluación Completa</h3>
              <p className="text-gray-600 leading-relaxed">
                Evaluaciones detalladas de reacondicionamiento para determinar las necesidades específicas de cada máquina.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2 border-t-4 border-larsen-blue">
              <div className="w-16 h-16 bg-gradient-to-br from-larsen-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sistemas Eléctricos</h3>
              <p className="text-gray-600 leading-relaxed">
                Verificación y prueba exhaustiva de todas las partes y comandos eléctricos y electrónicos.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2 border-t-4 border-larsen-red">
              <div className="w-16 h-16 bg-gradient-to-br from-larsen-red to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Partes Mecánicas</h3>
              <p className="text-gray-600 leading-relaxed">
                Verificación y prueba meticulosa de todas las partes mecánicas para garantizar funcionamiento óptimo.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2 border-t-4 border-larsen-blue">
              <div className="w-16 h-16 bg-gradient-to-br from-larsen-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reemplazo de Piezas</h3>
              <p className="text-gray-600 leading-relaxed">
                Cambio de todas las piezas usadas y desgastadas con repuestos originales de la más alta calidad.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2 border-t-4 border-larsen-red">
              <div className="w-16 h-16 bg-gradient-to-br from-larsen-red to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pruebas de Tejido</h3>
              <p className="text-gray-600 leading-relaxed">
                Pruebas exhaustivas de tejido antes del despacho, incluso con hilo y diseño proporcionado por el cliente.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:-translate-y-2 border-t-4 border-larsen-blue">
              <div className="w-16 h-16 bg-gradient-to-br from-larsen-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Equipo Especializado</h3>
              <p className="text-gray-600 leading-relaxed">
                Todos los trabajos son realizados por técnicos e ingenieros especializados y altamente capacitados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instalaciones Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Image/Placeholder */}
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <ImagePlaceholder 
                    width={600} 
                    height={400} 
                    text="Instalaciones de Producción"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center bg-larsen-blue/10 text-larsen-blue px-6 py-3 rounded-full text-sm font-semibold mb-6">
                  🏢 NUESTRAS INSTALACIONES
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  El Corazón de la <span className="text-larsen-red">Empresa</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  En esta unidad de producción de 2500 metros cuadrados, contamos con todo lo necesario 
                  para ofrecer el mejor servicio de reacondicionamiento del mercado.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-larsen-red/5 to-larsen-red/10 rounded-2xl p-6 border-2 border-larsen-red/20">
                    <div className="text-4xl font-bold text-larsen-red mb-2">2,500</div>
                    <div className="text-gray-700 font-medium">m² de instalaciones</div>
                  </div>
                  <div className="bg-gradient-to-br from-larsen-blue/5 to-larsen-blue/10 rounded-2xl p-6 border-2 border-larsen-blue/20">
                    <div className="text-4xl font-bold text-larsen-blue mb-2">50-60</div>
                    <div className="text-gray-700 font-medium">Máquinas en stock</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
                    <div className="text-4xl font-bold text-green-600 mb-2">✓</div>
                    <div className="text-gray-700 font-medium">Ingenieros especializados</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="text-4xl font-bold text-purple-600 mb-2">✓</div>
                    <div className="text-gray-700 font-medium">Depósito de repuestos</div>
                  </div>
                </div>

                <p className="mt-8 text-gray-600 italic border-l-4 border-larsen-red pl-4">
                  "Ingenieros técnicos y electrónicos especializados están siempre a disposición 
                  del cliente para cualquier información y solución."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Especialidades Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Nuestras <span className="text-larsen-red">Especialidades</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Más de medio siglo de experiencia en la industria textil
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Info Cards */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-larsen-red rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Industria</h3>
                    <p className="text-gray-300">Fabricación Textil</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-larsen-blue rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Fundada</h3>
                    <p className="text-gray-300">1964</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-larsen-red rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Sede Central</h3>
                    <p className="text-gray-300">Moglia, MN - Italia</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-larsen-blue rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Especialidades</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['Textil', 'Tejido de punto', 'Segunda mano', 'Máquinas de tejer', 'Moda'].map((specialty) => (
                        <span key={specialty} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-larsen-blue to-larsen-red">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            ¿Listo para trabajar con nosotros?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Más de 60 años de experiencia nos respaldan. Déjanos ayudarte a encontrar 
            la solución perfecta para tus necesidades de maquinaria textil.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              to="/cotizacion"
              className="bg-white text-larsen-red font-semibold text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:brightness-105 hover:-translate-y-1 inline-block"
            >
              Solicitar Cotización
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

