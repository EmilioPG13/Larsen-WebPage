import { useState } from 'react';
import { Link } from 'react-router-dom';
import ContactModal from '../components/ContactModal';
import type { Product, Machine } from '../types';
import machinesData from '../data/machines.json';

const MachinesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Product | undefined>();
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null);

  const handleMachineInterest = (machine: Machine) => {
    const productData: Product = {
      id: machine.id,
      name: machine.name,
      description: machine.description,
      price: 'Consultar precio',
      image: machine.image,
      features: [machine.speed, machine.width],
      category: machine.category,
      discount: machine.brand
    };
    setSelectedMachine(productData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMachine(undefined);
  };

  const toggleExpand = (machineId: string) => {
    setExpandedMachine(expandedMachine === machineId ? null : machineId);
  };

  const machines = machinesData as Machine[];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative py-18 pb-5 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-32 h-32 bg-larsen-blue rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-larsen-red rounded-full"></div>
          </div>

          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-6 py-3 rounded-full text-sm font-semibold mb-6">
                🤖 MÁQUINAS INDUSTRIALES
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Nuestras <span className="text-larsen-red">Máquinas</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Máquinas de tejido rectilíneo de última generación para la industria textil. 
                Tecnología avanzada, máxima productividad y calidad excepcional.
              </p>
            </div>
          </div>
        </section>

        {/* Machines Sections */}
        <section className="pt-4 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-12">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="grid lg:grid-cols-2 gap-8 p-8">
                    {/* Image - White background */}
                    <div className="relative">
                      <div className="bg-white rounded-xl p-8 flex items-center justify-center min-h-[300px]">
                        <img
                          src={machine.image}
                          alt={machine.name}
                          className="max-w-full max-h-[400px] object-contain"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col">
                      {/* Header */}
                      <div>
                        <div className="inline-flex items-center bg-larsen-blue/10 text-larsen-blue px-4 py-2 rounded-full text-sm font-semibold mb-4">
                          {machine.brand}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                          {machine.name}
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                          {machine.description}
                        </p>
                      </div>

                      {/* Quick specs */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">Velocidad</div>
                          <div className="text-lg font-semibold text-gray-900">{machine.speed}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">Ancho</div>
                          <div className="text-lg font-semibold text-gray-900">{machine.width}</div>
                        </div>
                      </div>

                      {/* Expandable specs */}
                      <div className="border-t border-gray-200 pt-4">
                        <button
                          onClick={() => toggleExpand(machine.id)}
                          className="w-full flex items-center justify-between text-left py-2 hover:text-larsen-red transition-all duration-300 group"
                        >
                          <span className="font-semibold text-gray-700 group-hover:translate-x-1 transition-transform duration-300">
                            Especificaciones Técnicas Detalladas
                          </span>
                          <svg
                            className={`w-5 h-5 transition-all duration-300 transform ${
                              expandedMachine === machine.id ? 'rotate-180 text-larsen-red' : 'group-hover:scale-110'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            expandedMachine === machine.id
                              ? 'max-h-[2000px] opacity-100 mt-4'
                              : 'max-h-0 opacity-0 mt-0'
                          }`}
                        >
                          <div className={`space-y-3 transform transition-all duration-500 ${
                            expandedMachine === machine.id
                              ? 'translate-y-0'
                              : '-translate-y-4'
                          }`}>
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Tipo:</span>
                                <span className="ml-2 text-gray-600">{machine.type}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Sistemas de tejido:</span>
                                <span className="ml-2 text-gray-600">{machine.knittingSystems}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Ancho de tejido:</span>
                                <span className="ml-2 text-gray-600">{machine.width}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Velocidad:</span>
                                <span className="ml-2 text-gray-600">{machine.speed}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Galga (Gauge):</span>
                                <span className="ml-2 text-gray-600">{machine.gauge}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Guía-hilos:</span>
                                <span className="ml-2 text-gray-600">{machine.yarnGuides}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Software:</span>
                                <span className="ml-2 text-gray-600">{machine.software}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Alimentación:</span>
                                <span className="ml-2 text-gray-600">{machine.power}</span>
                              </div>
                            </div>

                            {/* Capabilities */}
                            <div className="pt-3 border-t border-gray-100">
                              <span className="font-medium text-gray-700 block mb-2">Capacidades de tejido:</span>
                              <div className="flex flex-wrap gap-2">
                                {machine.capabilities.map((capability, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center bg-larsen-red/10 text-larsen-red px-3 py-1 rounded-full text-xs font-medium"
                                  >
                                    {capability}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="mt-auto pt-6">
                        <button
                          onClick={() => handleMachineInterest(machine)}
                          className="w-full bg-larsen-red text-white font-semibold py-4 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transform-gpu group relative overflow-hidden"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <span className="group-hover:scale-110 transition-transform duration-300 inline-block">💬</span>
                            Solicitar Cotización
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-larsen-red to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-larsen-blue to-larsen-red">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              ¿Necesitas asesoría especializada?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Nuestro equipo de expertos te ayudará a elegir la máquina perfecta 
              para tus necesidades de producción.
            </p>
            <Link
              to="/cotizacion"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-block bg-white text-larsen-red font-semibold text-lg px-12 py-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:brightness-105 hover:-translate-y-1"
            >
              Contactar Especialista
            </Link>
          </div>
        </section>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedMachine}
      />
    </>
  );
};

export default MachinesPage;

