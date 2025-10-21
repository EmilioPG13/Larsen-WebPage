import React from 'react';

const ContactAlternatives: React.FC = () => {
  const whatsappNumber = "+1234567890"; // Replace with actual WhatsApp number
  const phoneNumber = "+1 (555) 123-4567"; // Replace with actual phone number
  
  const whatsappMessage = encodeURIComponent("Hola, me interesa obtener una cotización para máquinas industriales. ¿Podrían ayudarme?");
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}`;

  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            ¿Prefieres Contacto <span className="text-larsen-red">Directo</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Nuestro equipo de ventas está disponible para atenderte de inmediato
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500 transition-colors duration-300">
              <svg className="w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
              WhatsApp
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Chatea con nosotros ahora mismo
            </p>
            <div className="text-green-600 font-semibold">
              Enviar mensaje →
            </div>
          </a>

          {/* Phone */}
          <a
            href={`tel:${phoneNumber}`}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 transition-colors duration-300">
              <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
              Teléfono
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Llámanos directamente
            </p>
            <div className="text-blue-600 font-semibold">
              {phoneNumber}
            </div>
          </a>

          {/* Business Hours */}
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Horarios
            </h3>
            <div className="text-gray-600 text-sm space-y-1">
              <p><strong>Lunes - Viernes:</strong></p>
              <p>8:00 AM - 6:00 PM</p>
              <p><strong>Sábados:</strong></p>
              <p>9:00 AM - 2:00 PM</p>
              <p className="text-xs text-gray-500 mt-2">
                Zona horaria: GMT-5
              </p>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            💡 <strong>Tip:</strong> Para cotizaciones más rápidas, usa nuestro formulario interactivo arriba
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactAlternatives;
