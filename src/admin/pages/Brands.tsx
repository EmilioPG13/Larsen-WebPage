import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { apiErrorMessage } from '../services/apiError';
import { PageError, PageHeader, PageLoading } from '../components/ui/kit';

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
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al cargar marcas'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (
      !window.confirm(
        `¿Eliminar la marca ${brand.name}? Sus productos y máquinas no se borran, pero quedarán sin marca. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await adminApi.deleteBrand(brand.id);
      await fetchBrands();
    } catch (err) {
      alert('Error al eliminar marca: ' + apiErrorMessage(err, err instanceof Error ? err.message : ''));
    }
  };

  if (loading) return <PageLoading>Cargando marcas...</PageLoading>;
  if (error) return <PageError>{error}</PageError>;

  return (
    <div className="adm-page">
      <PageHeader title="Gestión de Marcas" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {brands.map((brand) => (
          <article key={brand.id} className="adm-panel flex flex-col">
            <div className="flex items-center gap-4 border-b border-a-line p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-a-line bg-white p-1.5">
                <img src={brand.image} alt={brand.name} className="max-h-full max-w-full object-contain" />
              </div>
              <h3 className="m-0 text-[18px] font-semibold text-a-ink">{brand.name}</h3>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <p className="m-0 text-a-text2">{brand.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {brand.specialties.map((specialty, idx) => (
                  <span key={idx} className="adm-tag">
                    {specialty}
                  </span>
                ))}
              </div>
              <button onClick={() => handleDelete(brand)} className="adm-btn adm-btn-sm adm-btn-danger mt-auto self-start">
                Eliminar marca
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Brands;
