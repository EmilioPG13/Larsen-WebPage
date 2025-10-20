import React, { useState } from 'react';

const SeasonalOffer: React.FC = () => {
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
        <div className={`relative transition-all duration-1000 ease-out transform ${!isClosing ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
            } mt-8`}>
            {/* Golden glow effect container */}
            <div className="relative group cursor-pointer">
                {/* Golden glow background - only visible on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 rounded-lg opacity-0 group-hover:opacity-20 transition-all duration-500 blur-sm group-hover:blur-md"></div>

                {/* Main offer container */}
                <div className="relative bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6 group-hover:border-yellow-300 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-yellow-200/50">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1.5 hover:bg-white/40 rounded-full transition-all duration-300 group/close hover:scale-110 z-10"
                        aria-label="Cerrar oferta"
                    >
                        <svg
                            className="w-4 h-4 text-orange-600 group-hover/close:text-red-600 transition-all duration-300 group-hover/close:rotate-90"
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

                    {/* Offer content */}
                    <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3 group-hover:animate-bounce transition-all duration-300">🍂</span>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-800 transition-colors duration-300">
                                Ofertas de temporada
                            </h3>
                            <p className="text-sm text-orange-600 font-bold group-hover:text-yellow-600 transition-colors duration-300">
                                Hasta 25% de descuento
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                        Aprovecha nuestras ofertas especiales en máquinas industriales y accesorios.
                        <strong className="group-hover:text-yellow-700 transition-colors duration-300"> ¡Solo por tiempo limitado!</strong>
                    </p>

                    {/* Animated golden sparkles effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                        <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-100"></div>
                        <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-300"></div>
                        <div className="absolute bottom-4 left-8 w-1 h-1 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-500"></div>
                        <div className="absolute bottom-8 right-4 w-1.5 h-1.5 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-200"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonalOffer;
