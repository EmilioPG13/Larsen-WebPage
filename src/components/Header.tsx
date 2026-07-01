import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X } from './ui/icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useT } from '../i18n/useT';

const NAV: { key: keyof ReturnType<typeof useT>['nav']; path: string }[] = [
  { key: 'home', path: '/' },
  { key: 'machines', path: '/maquinas' },
  { key: 'brands', path: '/marcas' },
  { key: 'quote', path: '/cotizacion' },
  { key: 'about', path: '/nosotros' },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const themeTitle = isDark
    ? lang === 'es' ? 'Modo claro' : 'Light mode'
    : lang === 'es' ? 'Modo oscuro' : 'Dark mode';

  return (
    <header
      className="sticky top-0 z-50 border-b border-line backdrop-blur-custom"
      style={{ background: 'var(--bg-blur)', boxShadow: '0 6px 22px rgba(20,22,28,0.10)' }}
    >
      <div className="max-w-[1240px] mx-auto px-7 h-[74px] flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center shrink-0">
          <img
            src="/images/logo/larsen-logo-1.png"
            alt="Larsen Italiana"
            className="h-[34px] w-auto object-contain"
            style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => window.scrollTo(0, 0)}
                className={`relative text-[14.5px] font-medium tracking-[0.01em] px-3.5 py-2 rounded-lg transition-colors duration-200 hover:text-larsen-red hover:bg-larsen-red/[0.06] ${
                  active ? 'text-larsen-red' : 'text-ink'
                }`}
              >
                {t.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Theme"
            title={themeTitle}
            className="border border-line bg-fill w-[38px] h-[38px] rounded-full flex items-center justify-center text-ink transition-colors duration-200 hover:border-larsen-red hover:text-larsen-red"
          >
            {isDark ? <Sun size={17} /> : <Moon size={16} />}
          </button>

          {/* Language toggle */}
          <div className="hidden sm:flex items-center bg-fill border border-line rounded-full p-[3px]">
            {(['es', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="font-mono text-[11.5px] font-bold tracking-[0.04em] px-[11px] py-[5px] rounded-full transition-all duration-200"
                style={{
                  background: lang === l ? '#28327B' : 'transparent',
                  color: lang === l ? '#ffffff' : 'var(--faint)',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => go('/cotizacion')}
            className="hidden sm:inline-flex bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-sm px-5 py-[11px] rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 6px 18px rgba(216,30,42,0.24)' }}
          >
            {t.cta}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            className="md:hidden border border-line bg-fill w-[38px] h-[38px] rounded-full flex items-center justify-center text-ink"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-line animate-slide-down" style={{ background: 'var(--bg-blur)' }}>
          <nav className="max-w-[1240px] mx-auto px-7 py-4 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.path)}
                  className={`text-left text-[15px] font-medium px-3 py-2.5 rounded-lg transition-colors ${
                    active ? 'text-larsen-red bg-larsen-red/[0.06]' : 'text-ink hover:bg-fill'
                  }`}
                >
                  {t.nav[item.key]}
                </button>
              );
            })}
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-line">
              <div className="flex items-center bg-fill border border-line rounded-full p-[3px]">
                {(['es', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="font-mono text-[11.5px] font-bold tracking-[0.04em] px-3 py-[5px] rounded-full transition-all"
                    style={{
                      background: lang === l ? '#28327B' : 'transparent',
                      color: lang === l ? '#ffffff' : 'var(--faint)',
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={() => go('/cotizacion')}
                className="bg-larsen-red text-white font-semibold text-sm px-5 py-2.5 rounded-full"
              >
                {t.cta}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
