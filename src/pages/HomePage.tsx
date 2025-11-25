import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import HeroCarousel from '../components/HeroCarousel';
import ContactModal from '../components/ContactModal';
import type { Product } from '../types';
import { getProducts } from '../services/api';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Error al cargar productos';
        setError(`Error al cargar productos: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductInterest = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <>
      <HeroCarousel 
        products={products} 
        onProductInterest={handleProductInterest}
      />
      <Hero />
      
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </>
  );
};

export default HomePage;
