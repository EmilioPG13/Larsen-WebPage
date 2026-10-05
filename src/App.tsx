import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import QuoteBand from './components/QuoteBand';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import BrandsPage from './pages/BrandsPage';
import QuotePage from './pages/QuotePage';
import AboutPage from './pages/AboutPage';
import MachinesPage from './pages/MachinesPage';
import MachineDetailPage from './pages/MachineDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import { adminRoutes } from './admin/adminRoutes';
import { useT } from './i18n/useT';
import { initAnalytics, trackPageView } from './services/analytics';

function AppContent() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Inside the panel there is no fade (the layout fades the page itself), so switch pages at once.
      if (location.pathname.startsWith('/admin') && displayLocation.pathname.startsWith('/admin')) {
        setDisplayLocation(location);
        return;
      }
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
        // One key for the whole panel, so moving between its pages does not remount the layout.
        key={displayLocation.pathname.startsWith('/admin') ? 'admin' : displayLocation.pathname}
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

          {adminRoutes}

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isAdminRoute && <QuoteBand />}
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
