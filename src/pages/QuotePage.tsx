import React, { useEffect } from 'react';
import InteractiveQuoteForm from '../components/InteractiveQuoteForm';
import QuoteSteps from '../components/QuoteSteps';
import ContactAlternatives from '../components/ContactAlternatives';

const QuotePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-larsen-blue rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-larsen-red rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-6 py-3 rounded-full text-sm font-semibold mb-6">
              💰 COTIZACIÓN PERSONALIZADA
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Cotización <span className="text-larsen-red">Inteligente</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Obtén una cotización personalizada para tus necesidades industriales. 
              Nuestro sistema inteligente te guiará paso a paso para brindarte la mejor propuesta.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center bg-green-50 text-green-700 px-6 py-3 rounded-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Cotización sin compromiso</span>
              </div>
              <div className="flex items-center bg-blue-50 text-blue-700 px-6 py-3 rounded-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Respuesta en 24 horas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <QuoteSteps />

      {/* Interactive Quote Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <InteractiveQuoteForm />
        </div>
      </section>

      {/* Contact Alternatives */}
      <ContactAlternatives />
    </div>
  );
};

export default QuotePage;
