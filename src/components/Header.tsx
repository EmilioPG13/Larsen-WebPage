import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { SearchResult, Machine, Product } from '../types';
import machinesData from '../data/machines.json';
import productsData from '../data/products.json';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigation keyword mapping
  const navigationKeywords = {
    '/maquinas': ['máquina', 'máquinas', 'industriales', 'machine', 'machines', 'tejer', 'rectilínea', 'rectilinea'],
    '/marcas': ['marca', 'marcas', 'brand', 'brands', 'steiger', 'sangiacomo'],
    '/cotizacion': ['cotización', 'cotizacion', 'cotizar', 'precio', 'quote', 'presupuesto', 'solicitar'],
    '/nosotros': ['nosotros', 'acerca', 'sobre', 'empresa', 'about', 'historia', 'contacto']
  };

  // Search function
  const performSearch = (query: string): SearchResult[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search in machines
    const machines = machinesData as Machine[];
    machines.forEach((machine) => {
      const searchableText = [
        machine.name,
        machine.description,
        machine.brand,
        machine.category,
        machine.type,
        ...machine.capabilities
      ].join(' ').toLowerCase();

      if (searchableText.includes(lowerQuery)) {
        results.push({
          type: 'machine',
          id: machine.id,
          title: machine.name,
          subtitle: `${machine.brand} - ${machine.category}`,
          image: machine.image,
          route: '/maquinas',
          data: machine
        });
      }
    });

    // Search in products
    const products = productsData as Product[];
    products.forEach((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        ...product.features
      ].join(' ').toLowerCase();

      if (searchableText.includes(lowerQuery)) {
        results.push({
          type: 'product',
          id: product.id,
          title: product.name,
          subtitle: product.category,
          image: product.image,
          route: '/maquinas',
          data: product
        });
      }
    });

    // Search navigation keywords
    Object.entries(navigationKeywords).forEach(([route, keywords]) => {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        const pageNames: Record<string, string> = {
          '/maquinas': 'Máquinas Industriales',
          '/marcas': 'Nuestras Marcas',
          '/cotizacion': 'Cotización',
          '/nosotros': 'Acerca de nosotros'
        };

        // Avoid duplicates
        if (!results.some(r => r.type === 'page' && r.route === route)) {
          results.push({
            type: 'page',
            id: `page-${route}`,
            title: pageNames[route],
            route: route
          });
        }
      }
    });

    // Limit results per category
    const machinesResults = results.filter(r => r.type === 'machine').slice(0, 5);
    const productsResults = results.filter(r => r.type === 'product').slice(0, 5);
    const pagesResults = results.filter(r => r.type === 'page').slice(0, 3);

    return [...machinesResults, ...productsResults, ...pagesResults];
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    const results = performSearch(value);
    setSearchResults(results);
    setIsDropdownOpen(value.length > 0 && results.length > 0);
    setFocusedIndex(-1);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || searchResults.length === 0) {
      if (e.key === 'Escape') {
        setSearchQuery('');
        setSearchResults([]);
        setIsDropdownOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleResultClick(searchResults[focusedIndex]);
        }
        break;
      case 'Escape':
        setSearchQuery('');
        setSearchResults([]);
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group results by type
  const groupedResults = {
    machines: searchResults.filter(r => r.type === 'machine'),
    products: searchResults.filter(r => r.type === 'product'),
    pages: searchResults.filter(r => r.type === 'page')
  };

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
              <span className="relative z-10">Máquinas Disponibles</span>
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
            <div 
              ref={searchRef}
              className="relative hidden lg:block group transition-all duration-300 group-focus-within:-translate-y-0.5 group-focus-within:scale-[1.01] group-hover:-translate-y-0.5 group-hover:scale-[1.005]"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.length > 0 && searchResults.length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                className="pl-5 pr-12 py-3 border-2 border-gray-200 rounded-full w-80 bg-white focus:outline-none focus:border-gray-300 focus:shadow-lg focus:shadow-black/5 transition-all duration-300 hover:border-gray-300 hover:shadow-md"
              />
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-300 group-hover:text-gray-600 group-focus-within:text-gray-600 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Search Results Dropdown */}
              {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {/* Machines Section */}
                  {groupedResults.machines.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Máquinas
                      </div>
                      {groupedResults.machines.map((result) => {
                        const globalIndex = searchResults.indexOf(result);
                        return (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                              focusedIndex === globalIndex
                                ? 'bg-larsen-red/10 border-l-2 border-larsen-red'
                                : 'hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setFocusedIndex(globalIndex)}
                          >
                            {result.image && (
                              <img
                                src={result.image}
                                alt={result.title}
                                className="w-12 h-12 object-contain bg-white rounded border border-gray-200"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{result.title}</div>
                              {result.subtitle && (
                                <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Products Section */}
                  {groupedResults.products.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Productos
                      </div>
                      {groupedResults.products.map((result) => {
                        const globalIndex = searchResults.indexOf(result);
                        return (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                              focusedIndex === globalIndex
                                ? 'bg-larsen-red/10 border-l-2 border-larsen-red'
                                : 'hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setFocusedIndex(globalIndex)}
                          >
                            {result.image && (
                              <img
                                src={result.image}
                                alt={result.title}
                                className="w-12 h-12 object-contain bg-white rounded border border-gray-200"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{result.title}</div>
                              {result.subtitle && (
                                <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pages Section */}
                  {groupedResults.pages.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Páginas
                      </div>
                      {groupedResults.pages.map((result) => {
                        const globalIndex = searchResults.indexOf(result);
                        return (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                              focusedIndex === globalIndex
                                ? 'bg-larsen-red/10 border-l-2 border-larsen-red'
                                : 'hover:bg-gray-50'
                            }`}
                            onMouseEnter={() => setFocusedIndex(globalIndex)}
                          >
                            <div className="w-10 h-10 flex items-center justify-center bg-larsen-blue/10 rounded-lg">
                              <svg className="w-5 h-5 text-larsen-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">{result.title}</div>
                            </div>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
