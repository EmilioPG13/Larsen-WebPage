import React, { useState } from 'react';

const TopBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-larsen-blue py-3 transition-all duration-800 ease-in-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between text-sm text-white">
          <div className="flex items-center space-x-8">
            <span className="font-bold text-white">LARSEN ITALIANA</span>
            <span className="text-larsen-pink font-medium">INDUSTRIAL QUALITY SINCE 2004</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white">🇮🇹 Moglia, Italia</span>
            <button
              onClick={handleClose}
              className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors duration-200 group"
              aria-label="Cerrar banner"
            >
              <svg 
                className="w-4 h-4 text-white group-hover:text-larsen-pink transition-colors duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
