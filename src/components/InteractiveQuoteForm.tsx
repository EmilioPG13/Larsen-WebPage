import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

interface QuoteFormData {
  // Step 1: Personal Info
  name: string;
  email: string;
  phone: string;
  company: string;
  
  // Step 2: Industry
  industry: string;
  
  // Step 3: Production Volume
  productionVolume: string;
  
  // Step 4: Budget
  budget: string;
  
  // Step 5: Purchase Date
  purchaseDate: string;
  
  // Step 6: Message
  message: string;
}

const InteractiveQuoteForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [formData, setFormData] = useState<QuoteFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    productionVolume: '',
    budget: '',
    purchaseDate: '',
    message: ''
  });

  const totalSteps = 6;

  const industries = [
    'Textil y Confección',
    'Cuero y Calzado',
    'Tapicería y Muebles',
    'Automotriz',
    'Marroquinería',
    'Deportiva y Outdoor',
    'Médica y Técnica',
    'Otro'
  ];

  const budgetRanges = [
    'Menos de $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    '$50,000 - $100,000',
    'Más de $100,000',
    'Prefiero no especificar'
  ];

  const purchaseDates = [
    'Inmediato (1-2 semanas)',
    '1-3 meses',
    '3-6 meses',
    '6-12 meses',
    'Más de 1 año',
    'Solo investigando'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.email && formData.phone && formData.company;
      case 2:
        return true; // Industry is optional
      case 3:
        return true; // Production volume is optional
      case 4:
        return formData.budget;
      case 5:
        return formData.purchaseDate;
      case 6:
        return true; // Message is optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const result = await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
        'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
        {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          company: formData.company,
          industry: formData.industry || 'No especificado',
          production_volume: formData.productionVolume || 'No especificado',
          budget: formData.budget,
          purchase_date: formData.purchaseDate,
          message: formData.message || 'Sin mensaje adicional',
          to_email: 'ventas@larsenitaliana.com', // Replace with your email
        },
        'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
      );

      console.log('Quote request sent successfully:', result);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          industry: '',
          productionVolume: '',
          budget: '',
          purchaseDate: '',
          message: ''
        });
        setCurrentStep(1);
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error sending quote request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent"
                  placeholder="Su nombre completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent"
                  placeholder="su.email@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent"
                  placeholder="Nombre de su empresa"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tipo de Industria</h3>
            <p className="text-gray-600 mb-6">Selecciona el sector que mejor describe tu negocio (opcional)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {industries.map((industry) => (
                <label
                  key={industry}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.industry === industry
                      ? 'border-larsen-red bg-larsen-red/5'
                      : 'border-gray-200 hover:border-larsen-red/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="industry"
                    value={industry}
                    checked={formData.industry === industry}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    formData.industry === industry
                      ? 'border-larsen-red bg-larsen-red'
                      : 'border-gray-300'
                  }`}>
                    {formData.industry === industry && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{industry}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Volumen de Producción</h3>
            <p className="text-gray-600 mb-6">¿Cuál es tu volumen de producción esperado? (opcional)</p>
            
            <div>
              <label htmlFor="productionVolume" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del volumen de producción
              </label>
              <textarea
                id="productionVolume"
                name="productionVolume"
                rows={4}
                value={formData.productionVolume}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent resize-none"
                placeholder="Ej: 1000 piezas por día, 50 trabajadores, producción continua..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Presupuesto Aproximado</h3>
            <p className="text-gray-600 mb-6">Selecciona el rango que mejor se ajuste a tu presupuesto</p>
            
            <div className="space-y-3">
              {budgetRanges.map((budget) => (
                <label
                  key={budget}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.budget === budget
                      ? 'border-larsen-red bg-larsen-red/5'
                      : 'border-gray-200 hover:border-larsen-red/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="budget"
                    value={budget}
                    checked={formData.budget === budget}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    formData.budget === budget
                      ? 'border-larsen-red bg-larsen-red'
                      : 'border-gray-300'
                  }`}>
                    {formData.budget === budget && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{budget}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Fecha Estimada de Compra</h3>
            <p className="text-gray-600 mb-6">¿Cuándo planeas realizar la compra?</p>
            
            <div className="space-y-3">
              {purchaseDates.map((date) => (
                <label
                  key={date}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.purchaseDate === date
                      ? 'border-larsen-red bg-larsen-red/5'
                      : 'border-gray-200 hover:border-larsen-red/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="purchaseDate"
                    value={date}
                    checked={formData.purchaseDate === date}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    formData.purchaseDate === date
                      ? 'border-larsen-red bg-larsen-red'
                      : 'border-gray-300'
                  }`}>
                    {formData.purchaseDate === date && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{date}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Mensaje Adicional</h3>
            <p className="text-gray-600 mb-6">¿Hay algo específico que quieras que sepamos? (opcional)</p>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Necesidades específicas o comentarios
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-larsen-red focus:border-transparent resize-none"
                placeholder="Cuéntanos sobre tus necesidades específicas, tipos de materiales, características especiales requeridas, etc..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mt-8">
              <h4 className="font-bold text-gray-900 mb-4">Resumen de tu solicitud:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Contacto:</strong> {formData.name} ({formData.email})</p>
                <p><strong>Empresa:</strong> {formData.company}</p>
                {formData.industry && <p><strong>Industria:</strong> {formData.industry}</p>}
                <p><strong>Presupuesto:</strong> {formData.budget}</p>
                <p><strong>Fecha estimada:</strong> {formData.purchaseDate}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Solicitud Enviada!</h3>
        <p className="text-gray-600 mb-6">
          Hemos recibido tu solicitud de cotización. Nuestro equipo la revisará y te contactaremos dentro de las próximas 24 horas.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            📧 Recibirás una confirmación por email en breve<br/>
            📞 Un especialista se pondrá en contacto contigo pronto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-gray-50 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Cotización Inteligente</h2>
          <span className="text-sm text-gray-500">Paso {currentStep} de {totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-larsen-red to-larsen-blue h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        {renderStep()}

        {/* Submit Status */}
        {submitStatus === 'error' && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Error al enviar la solicitud. Por favor, inténtalo de nuevo.
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid()}
              className="px-8 py-3 bg-gradient-to-r from-larsen-red to-larsen-blue text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="px-6 py-3 bg-gradient-to-r from-larsen-red to-larsen-blue text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuoteForm;
