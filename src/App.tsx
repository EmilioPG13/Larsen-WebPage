import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TopBanner from './components/TopBanner';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BrandsPage from './pages/BrandsPage';
import QuotePage from './pages/QuotePage';
import AboutPage from './pages/AboutPage';
import MachinesPage from './pages/MachinesPage';
import AdminLogin from './admin/pages/Login';
import AdminDashboard from './admin/pages/Dashboard';
import AdminLayout from './admin/components/AdminLayout';
import ProtectedRoute from './admin/components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [displayLocation]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white">
      {!isAdminRoute && (
        <>
          <TopBanner />
          <Header />
        </>
      )}
      
      <div 
        key={displayLocation.pathname}
        className={`page-transition-enter ${
          transitionStage === 'fadeOut' 
            ? 'opacity-0 translate-y-2' 
            : 'opacity-100 translate-y-0'
        } transition-all duration-400 ease-out`}
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<HomePage />} />
          <Route path="/marcas" element={<BrandsPage />} />
          <Route path="/maquinas" element={<MachinesPage />} />
          <Route path="/cotizacion" element={<QuotePage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
