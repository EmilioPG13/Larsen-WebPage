import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-white shadow-lg animate-slide-down">
      {/* Main navigation - cleaner layout */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - simplified */}
          <div className="flex items-center">
            <div className="flex items-center">
              <Link to="/">
                <img 
                  src="/images/logo/larsen-logo-1.png" 
                  alt="Larsen Italiana" 
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>
          </div>

          {/* Navigation menu - centered */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/maquinas" 
              className={`relative text-gray-700 font-medium py-2 px-3 transition-all duration-300 group ${
                location.pathname === '/maquinas' ? 'text-larsen-red' : 'hover:text-larsen-red'
              }`}
            >
              <span className="relative z-10">Máquinas Industriales</span>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-larsen-blue transition-all duration-300 ${
                location.pathname === '/maquinas' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
              <span className="absolute inset-0 bg-larsen-red/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></span>
            </Link>
            <Link 
              to="/marcas" 
              className={`relative text-gray-700 font-medium py-2 px-3 transition-all duration-300 group ${
                location.pathname === '/marcas' ? 'text-larsen-red' : 'hover:text-larsen-red'
              }`}
            >
              <span className="relative z-10">Nuestras Marcas</span>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-larsen-blue transition-all duration-300 ${
                location.pathname === '/marcas' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
              <span className="absolute inset-0 bg-larsen-red/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></span>
            </Link>
            <Link 
              to="/cotizacion" 
              className={`relative text-gray-700 font-medium py-2 px-3 transition-all duration-300 group ${
                location.pathname === '/cotizacion' ? 'text-larsen-red' : 'hover:text-larsen-red'
              }`}
            >
              <span className="relative z-10">Cotización</span>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-larsen-blue transition-all duration-300 ${
                location.pathname === '/cotizacion' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
              <span className="absolute inset-0 bg-larsen-red/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></span>
            </Link>
            <Link 
              to="/nosotros" 
              className={`relative text-gray-700 font-medium py-2 px-3 transition-all duration-300 group ${
                location.pathname === '/nosotros' ? 'text-larsen-red' : 'hover:text-larsen-red'
              }`}
            >
              <span className="relative z-10">Acerca de nosotros</span>
              <span className={`absolute bottom-0 left-0 h-0.5 bg-larsen-blue transition-all duration-300 ${
                location.pathname === '/nosotros' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
              <span className="absolute inset-0 bg-larsen-red/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></span>
            </Link>
          </div>

          {/* Right side - simplified */}
          <div className="flex items-center">
            {/* Search */}
            <div className="relative hidden lg:block group">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="pl-5 pr-12 py-3 border border-gray-200 rounded-full w-80 bg-gray-50 focus:outline-none focus:bg-white focus:border-larsen-red/50 focus:shadow-lg focus:shadow-larsen-red/10 transition-all duration-300 transform focus:scale-[1.02]"
              />
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-larsen-red transition-all duration-300 hover:scale-110 group-focus-within:text-larsen-red">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-larsen-red/0 via-larsen-red/5 to-larsen-red/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
