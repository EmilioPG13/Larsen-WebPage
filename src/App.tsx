import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopBanner from './components/TopBanner';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BrandsPage from './pages/BrandsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <TopBanner />
        <Header />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/marcas" element={<BrandsPage />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
