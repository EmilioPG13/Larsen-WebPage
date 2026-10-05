import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { track } from '../services/analytics';
import { brands } from '../data/brands';
import { Phone, Mail, MapPin, Linkedin, Instagram } from './ui/icons';

const NAV: { key: 'home' | 'machines' | 'brands' | 'quote' | 'about'; path: string }[] = [
  { key: 'home', path: '/' },
  { key: 'machines', path: '/maquinas' },
  { key: 'brands', path: '/marcas' },
  { key: 'quote', path: '/cotizacion' },
  { key: 'about', path: '/nosotros' },
];

const headingClass = 'text-[14px] font-semibold text-white m-0 mb-[18px]';
const linkClass = 'text-[14px] text-white/70 transition-colors duration-200 hover:text-white';

const Footer = () => {
  const t = useT();

  return (
    <footer className="bg-footer text-white">
      <div className="max-w-[1280px] mx-auto px-7 pt-[60px] pb-[30px] grid grid-cols-1 md:grid-cols-[1.7fr_1fr_1fr_1fr] gap-x-10 gap-y-12">
        {/* Identity */}
        <div>
          <img
            src="/images/logo/larsen-logo-outline.svg"
            alt="Larsen Italiana"
            width={100}
            height={46}
            loading="lazy"
            decoding="async"
            className="h-[46px] w-auto object-contain mb-5"
          />
          <p className="text-[14px] leading-[1.62] text-white/70 mb-[22px] max-w-[320px]">{t.foot.blurb}</p>
          <div className="flex items-center gap-2.5">
            <a
              href="https://www.linkedin.com/company/larsen-italiana-soc-arl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex w-[38px] h-[38px] border border-white/20 items-center justify-center text-white/70 transition-colors duration-200 hover:bg-larsen-blue hover:text-white hover:border-larsen-blue"
            >
              <Linkedin size={17} />
            </a>
            <a
              href="https://www.instagram.com/larsen.italiana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex w-[38px] h-[38px] border border-white/20 items-center justify-center text-white/70 transition-colors duration-200 hover:bg-larsen-blue hover:text-white hover:border-larsen-blue"
            >
              <Instagram size={17} />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className={headingClass}>{t.foot.prod}</h4>
          <div className="flex flex-col gap-[11px]">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => window.scrollTo(0, 0)}
                className={linkClass}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h4 className={headingClass}>{t.bpage.k}</h4>
          <div className="flex flex-col gap-[11px]">
            {brands.map((b) => (
              <Link
                key={b.name}
                to="/marcas"
                onClick={() => window.scrollTo(0, 0)}
                className={linkClass}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className={headingClass}>{t.foot.contact}</h4>
          <div className="flex flex-col gap-[15px] text-[14px] text-white/70">
            <a
              href="tel:+527753650376"
              onClick={() => track('click_phone', { source: 'footer' })}
              className="flex items-start gap-3 transition-colors duration-200 hover:text-white"
            >
              <Phone size={16} className="shrink-0 mt-[3px] text-white/50" />
              <span className="flex flex-col gap-[3px]">
                <span>+52 775 365 0376</span>
                <span className="text-white/55 text-[13px]">+39 348 6907430</span>
              </span>
            </a>
            <a href="mailto:admin@larsenitaliana.com" className="flex items-center gap-3 transition-colors duration-200 hover:text-white">
              <Mail size={16} className="shrink-0 text-white/50" />
              <span>admin@larsenitaliana.com</span>
            </a>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="shrink-0 mt-[3px] text-white/50" />
              <span className="flex flex-col gap-[3px]">
                <span>{t.contact.office}: {t.contact.mexico}</span>
                <span className="text-white/55 text-[13px]">{t.contact.workshop}: {t.contact.italy}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-7 pr-24 py-[22px] pb-24 md:pb-[22px] flex flex-wrap justify-between items-center gap-3.5 text-[12px] text-white/55">
          <p className="m-0">© {new Date().getFullYear()} Larsen Italiana · {t.foot.rights}</p>
          <div className="flex gap-[26px]">
            <a href="#" className="transition-colors duration-200 hover:text-white">{t.foot.privacy}</a>
            <a href="#" className="transition-colors duration-200 hover:text-white">{t.foot.terms}</a>
            <a href="#" className="transition-colors duration-200 hover:text-white">{t.foot.cookies}</a>
            {/* Discreet way in for the team; the panel itself asks for a login. */}
            <Link to="/admin/login" className="transition-colors duration-200 hover:text-white">{t.foot.team}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
