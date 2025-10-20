import { useState } from 'react';
import TopBanner from './components/TopBanner';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ContactModal from './components/ContactModal';
import Footer from './components/Footer';
import type { Product } from './types';
import productsData from './data/products.json';

function App() {
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
    <div className="min-h-screen bg-white">
      <TopBanner />
      <Header />
      <Hero onProductInterest={handleProductInterest} />
      <ProductGrid 
        products={productsData as Product[]} 
        onProductInterest={handleProductInterest}
      />
      <Footer />
      
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
}

export default App;
