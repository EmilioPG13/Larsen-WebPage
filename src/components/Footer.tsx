import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Warranty section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🛡️ GARANTÍA COMPLETA
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                365 Días de Garantía
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Todas nuestras máquinas reacondicionadas incluyen <span className="font-bold text-larsen-red">365 días de garantía completa</span>,
                respaldadas por nuestro equipo de técnicos especializados y servicio postventa.
              </p>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4 text-larsen-blue">🛡️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cobertura Total</h3>
                <p className="text-gray-600 mb-4">Reparaciones, piezas y asistencia técnica incluida durante todo el período de garantía</p>
                <div className="bg-larsen-red/10 text-larsen-red px-4 py-2 rounded-lg text-sm font-semibold">
                  Servicio 24/7 Disponible
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="mb-6 flex justify-center md:justify-start">
                <img 
                  src="/images/logo/larsen-logo-2.png" 
                  alt="Larsen Italiana SRL" 
                  className="h-12 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 mb-4">
                Especialistas en máquinas de coser industriales de alta calidad. 
                Más de 20 años de experiencia en el sector textil.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.linkedin.com/company/larsen-italiana-soc-arl" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Productos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/maquinas" className="hover:text-white transition-colors">Máquinas Industriales</Link></li>
                <li><Link to="/marcas" className="hover:text-white transition-colors">Nuestras Marcas</Link></li>
                <li><Link to="/cotizacion" className="hover:text-white transition-colors">Cotización</Link></li>
                <li><Link to="/nosotros" className="hover:text-white transition-colors">Acerca de nosotros</Link></li>

              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manuales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Servicio Técnico</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Garantías</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-larsen-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-larsen-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>ventas@larsenitaliana.com</span>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-1 text-larsen-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Moglia, Italia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <div>
              <p>&copy; 2025 Larsen Italiana. Todos los derechos reservados.</p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
