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
      className={`sticky top-0 z-50 bg-(--bar) text-(--bar-ink) border-b border-(--bar-line) transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
        effectiveHidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      aria-hidden={effectiveHidden || undefined}
      inert={effectiveHidden || undefined}
    >
      <div className="max-w-[1280px] mx-auto px-7 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center shrink-0">
          {/* Traced logo in its official colors on the light bar; reversed to white on the dark one. */}
          <img
            src={isDark ? '/images/logo/larsen-logo-white.svg' : '/images/logo/larsen-logo.svg'}
            alt="Larsen Italiana"
            width={85}
            height={38}
            className="h-[38px] w-auto object-contain"
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
                    ? 'text-(--bar-ink) underline decoration-larsen-red'
                    : 'text-(--bar-ink-2) no-underline hover:text-(--bar-ink)'
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
            className="w-[34px] h-[30px] flex items-center justify-center text-(--bar-ink-2) transition-colors duration-200 hover:text-(--bar-ink)"
          >
            {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
          </button>

          {/* Language toggle */}
          <div className="hidden sm:flex items-center border border-(--bar-edge)">
            {(['es', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`text-[12px] font-semibold tracking-[0.06em] px-2.5 py-[6px] transition-colors duration-200 ${
                  lang === l ? 'bg-(--bar-ink) text-(--bar)' : 'text-(--bar-ink-2) hover:text-(--bar-ink)'
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
            className="md:hidden w-[34px] h-[30px] flex items-center justify-center text-(--bar-ink)"
          >
            {menuOpen ? <X size={19} strokeWidth={1.5} /> : <Menu size={19} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-(--bar-line) bg-(--bar)">
          <nav className="max-w-[1280px] mx-auto px-7 py-4 flex flex-col">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`text-left text-[15px] py-3 border-b border-(--bar-line) last:border-b-0 transition-colors ${
                    active ? 'text-(--bar-ink) font-semibold' : 'text-(--bar-ink-2) hover:text-(--bar-ink)'
                  }`}
                >
                  {t.nav[item.key]}
                </button>
              );
            })}
            <div className="flex items-center gap-0 mt-4 border border-(--bar-edge) w-max">
              {(['es', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`text-[12px] font-semibold tracking-[0.06em] px-3 py-[7px] transition-colors ${
                    lang === l ? 'bg-(--bar-ink) text-(--bar)' : 'text-(--bar-ink-2)'
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
