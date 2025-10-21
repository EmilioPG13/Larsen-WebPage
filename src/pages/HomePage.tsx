import { useState } from 'react';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
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
      <Hero onProductInterest={handleProductInterest} />
      <ProductGrid 
        products={productsData as Product[]} 
        onProductInterest={handleProductInterest}
      />
      
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </>
  );
};

export default HomePage;
