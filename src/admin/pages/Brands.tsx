import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface Brand {
  id: string;
  name: string;
  image: string;
  description: string;
  specialties: string[];
  createdAt: string;
  updatedAt: string;
}

const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getBrands();
      setBrands(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar marcas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando marcas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Marcas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <div key={brand.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="w-16 h-16 object-contain"
                />
                <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">{brand.description}</p>
              <div className="flex flex-wrap gap-2">
                {brand.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="inline-flex px-2 py-1 text-xs font-medium bg-larsen-red/10 text-larsen-red rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Brands;

