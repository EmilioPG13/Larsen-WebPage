import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import BrandsPage from './pages/BrandsPage';
import QuotePage from './pages/QuotePage';
import AboutPage from './pages/AboutPage';
import MachinesPage from './pages/MachinesPage';
import MachineDetailPage from './pages/MachineDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLogin from './admin/pages/Login';
import AdminDashboard from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/Products';
import AdminMachines from './admin/pages/Machines';
import AdminBrands from './admin/pages/Brands';
import AdminLeads from './admin/pages/Leads';
import AdminUsers from './admin/pages/Users';
import AdminReports from './admin/pages/Reports';
import AdminInventory from './admin/pages/Inventory';
import AdminLayout from './admin/components/AdminLayout';
import ProtectedRoute from './admin/components/ProtectedRoute';
import { useT } from './i18n/useT';
import { initAnalytics, trackPageView } from './services/analytics';

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

  // Analytics: init once, then send a manual page_view on each route change (SPA).
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const t = useT();

  return (
    <div className="min-h-screen bg-bg text-ink">
      {!isAdminRoute && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:bg-larsen-red focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:font-semibold"
        >
          {t.skipToContent}
        </a>
      )}
      {!isAdminRoute && <Header />}

      <main
        id="main-content"
        key={displayLocation.pathname}
        // The admin shell uses position: fixed; a transform on this ancestor would turn it into its containing block.
        className={
          isAdminRoute
            ? ''
            : `page-transition-enter ${
                transitionStage === 'fadeOut'
                  ? 'opacity-0 translate-y-2'
                  : 'opacity-100 translate-y-0'
              } transition-all duration-400 ease-out`
        }
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<HomePage />} />
          <Route path="/marcas" element={<BrandsPage />} />
          <Route path="/maquinas" element={<MachinesPage />} />
          <Route path="/maquinas/:id" element={<MachineDetailPage />} />
          <Route path="/cotizacion" element={<QuotePage />} />
          <Route path="/nosotros" element={<AboutPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminProducts />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/machines"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminMachines />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminBrands />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminLeads />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventario"
            element={
              <ProtectedRoute roles={['ADMIN', 'INVENTARIO']}>
                <AdminLayout>
                  <AdminInventory />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reportes"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout>
                  <AdminReports />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppButton />}
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
