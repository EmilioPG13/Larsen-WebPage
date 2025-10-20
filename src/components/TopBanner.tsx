import React, { useState } from 'react';

const TopBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        // Delay the actual removal to allow animation to complete
        setTimeout(() => {
            setIsVisible(false);
        }, 1000);
    };

    if (!isVisible) return null;

    return (
        <div className={`bg-larsen-blue py-3 transition-all duration-1000 ease-out transform ${!isClosing ? 'translate-y-0 opacity-100 scale-y-100' : '-translate-y-full opacity-0 scale-y-0'
            }`}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between text-sm text-white">
                    <div className="flex items-center space-x-8">
                        <span className="font-black text-white tracking-wide">LARSEN ITALIANA</span>
                        <span className="text-larsen-pink font-bold tracking-wide">INDUSTRIAL QUALITY SINCE 2004</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-white font-semibold">🇮🇹 Moglia, Italia</span>
                        <button
                            onClick={handleClose}
                            className="ml-4 p-1.5 hover:bg-white/20 rounded-full transition-all duration-300 group hover:scale-110"
                            aria-label="Cerrar banner"
                        >
                            <svg
                                className="w-4 h-4 text-white group-hover:text-larsen-pink transition-all duration-300 group-hover:rotate-90"
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
