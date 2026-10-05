import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X } from './ui/icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useT } from '../i18n/useT';
import { useHideOnScroll } from '../hooks/useHideOnScroll';

const NAV: { key: keyof ReturnType<typeof useT>['nav']; path: string }[] = [
  { key: 'home', path: '/' },
  { key: 'machines', path: '/maquinas' },
  { key: 'brands', path: '/marcas' },
  { key: 'quote', path: '/cotizacion' },
  { key: 'about', path: '/nosotros' },
];

const CTA_CLASS =
  'inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[13px] h-9 px-4 transition-colors';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const hidden = useHideOnScroll({ disabled: menuOpen, resetKey: location.pathname });
  const effectiveHidden = hidden && !menuOpen;

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
      className={`sticky top-0 z-50 bg-nav text-white border-b border-white/10 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
        effectiveHidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      aria-hidden={effectiveHidden || undefined}
      inert={effectiveHidden || undefined}
    >
      <div className="max-w-[1280px] mx-auto px-7 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center shrink-0">
          <img
            src="/images/logo/larsen-logo-1.png"
            alt="Larsen Italiana"
            className="h-[26px] w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV.filter((item) => item.key !== 'quote').map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => window.scrollTo(0, 0)}
                aria-current={active ? 'page' : undefined}
                className={`text-[14px] transition-colors duration-200 underline-offset-[8px] decoration-2 ${
                  active
                    ? 'text-white underline decoration-larsen-red'
                    : 'text-white/70 no-underline hover:text-white'
                }`}
              >
                {t.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Theme"
            title={themeTitle}
            className="w-[34px] h-[30px] flex items-center justify-center text-white/70 transition-colors duration-200 hover:text-white"
          >
            {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
          </button>

          {/* Language toggle */}
          <div className="hidden sm:flex items-center border border-white/25">
            {(['es', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`text-[12px] font-semibold tracking-[0.06em] px-2.5 py-[6px] transition-colors duration-200 ${
                  lang === l ? 'bg-white text-nav' : 'text-white/70 hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Quote CTA — always one tap away, on every viewport */}
          <Link
            to="/cotizacion"
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo(0, 0);
            }}
            className={CTA_CLASS}
          >
            {t.cta}
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="md:hidden w-[34px] h-[30px] flex items-center justify-center text-white"
          >
            {menuOpen ? <X size={19} strokeWidth={1.5} /> : <Menu size={19} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-nav">
          <nav className="max-w-[1280px] mx-auto px-7 py-4 flex flex-col">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`text-left text-[15px] py-3 border-b border-white/10 last:border-b-0 transition-colors ${
                    active ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t.nav[item.key]}
                </button>
              );
            })}
            <div className="flex items-center gap-0 mt-4 border border-white/25 w-max">
              {(['es', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`text-[12px] font-semibold tracking-[0.06em] px-3 py-[7px] transition-colors ${
                    lang === l ? 'bg-white text-nav' : 'text-white/70'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
