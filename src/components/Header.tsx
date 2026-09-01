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
      className={`sticky top-0 z-50 border-b border-line backdrop-blur-custom transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
        effectiveHidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ background: 'var(--bg-blur)' }}
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
            style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => window.scrollTo(0, 0)}
                aria-current={active ? 'page' : undefined}
                className={`text-[14px] transition-colors duration-200 underline-offset-[7px] decoration-2 ${
                  active
                    ? 'text-ink underline decoration-deep'
                    : 'text-text2 no-underline hover:text-deep'
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
            className="w-[34px] h-[30px] flex items-center justify-center text-text2 transition-colors duration-200 hover:text-deep"
          >
            {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
          </button>

          {/* Language toggle */}
          <div className="hidden sm:flex items-center border border-line">
            {(['es', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`font-mono text-[11px] tracking-[0.14em] px-2.5 py-[6px] transition-colors duration-200 ${
                  lang === l ? 'bg-deep text-white' : 'text-muted hover:text-deep'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="md:hidden w-[34px] h-[30px] flex items-center justify-center text-text2"
          >
            {menuOpen ? <X size={19} strokeWidth={1.5} /> : <Menu size={19} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-line" style={{ background: 'var(--bg-blur)' }}>
          <nav className="max-w-[1280px] mx-auto px-7 py-4 flex flex-col">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`text-left text-[15px] py-3 border-b border-line-soft last:border-b-0 transition-colors ${
                    active ? 'text-ink font-medium' : 'text-text2 hover:text-deep'
                  }`}
                >
                  {t.nav[item.key]}
                </button>
              );
            })}
            <div className="flex items-center gap-0 mt-4 border border-line w-max">
              {(['es', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`font-mono text-[11px] tracking-[0.14em] px-3 py-[7px] transition-colors ${
                    lang === l ? 'bg-deep text-white' : 'text-muted'
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
