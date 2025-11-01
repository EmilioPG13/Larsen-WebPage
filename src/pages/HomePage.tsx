import { useState } from 'react';
import Hero from '../components/Hero';
import HeroCarousel from '../components/HeroCarousel';
import ContactModal from '../components/ContactModal';
import type { Product } from '../types';
import productsData from '../data/products.json';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const handleProductInterest = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(undefined);
  };

  return (
    <>
      <HeroCarousel 
        products={productsData as Product[]} 
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
