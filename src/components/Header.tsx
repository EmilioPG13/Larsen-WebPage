import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg">
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
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-all duration-200 py-2 px-3 border-b-2 border-transparent hover:border-larsen-blue">
              Máquinas Industriales
            </a>
            <Link to="/marcas" className="text-gray-700 hover:text-larsen-red font-medium transition-all duration-200 py-2 px-3 border-b-2 border-transparent hover:border-larsen-blue">
              Nuestras Marcas
            </Link>
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-all duration-200 py-2 px-3 border-b-2 border-transparent hover:border-larsen-blue">
              Accesorios
            </a>
            <Link to="/cotizacion" className="text-gray-700 hover:text-larsen-red font-medium transition-all duration-200 py-2 px-3 border-b-2 border-transparent hover:border-larsen-blue">
              Cotización
            </Link>
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-all duration-200 py-2 px-3 border-b-2 border-transparent hover:border-larsen-blue">
              Soporte
            </a>
          </div>

          {/* Right side - simplified */}
          <div className="flex items-center">
            {/* Search */}
            <div className="relative hidden lg:block focus-within:translate-y-[-2px] transition-transform duration-200">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="pl-5 pr-12 py-3 border border-gray-200 rounded-full w-80 bg-gray-50 focus:outline-none focus:bg-white transition-colors duration-200"
              />
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-larsen-red transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
