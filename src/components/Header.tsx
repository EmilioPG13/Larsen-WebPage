import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg">
      {/* Main navigation - cleaner layout */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - simplified */}
          <div className="flex items-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-larsen-blue tracking-wide">LARSEN</h1>
              <p className="text-sm text-larsen-red font-semibold">INDUSTRIAL MACHINES</p>
            </div>
          </div>

          {/* Navigation menu - centered */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-50">
              Máquinas Industriales
            </a>
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-50">
              Overlock
            </a>
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-50">
              Accesorios
            </a>
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-50">
              Ofertas
            </a>
            <a href="#" className="text-gray-700 hover:text-larsen-red font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-50">
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
