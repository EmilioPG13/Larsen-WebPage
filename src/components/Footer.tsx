import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { Phone, Mail, MapPin, Linkedin } from './ui/icons';

const NAV: { key: 'home' | 'machines' | 'brands' | 'quote' | 'about'; path: string }[] = [
  { key: 'home', path: '/' },
  { key: 'machines', path: '/maquinas' },
  { key: 'brands', path: '/marcas' },
  { key: 'quote', path: '/cotizacion' },
  { key: 'about', path: '/nosotros' },
];

const Footer = () => {
  const t = useT();

  return (
    <footer className="bg-[#1a1a1f] text-white">
      <div className="max-w-[1240px] mx-auto px-7 pt-[60px] pb-[30px] grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-12">
        {/* Brand */}
        <div>
          <img
            src="/images/logo/larsen-logo-2.png"
            alt="Larsen Italiana"
            className="h-10 w-auto object-contain mb-5"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-[14.5px] leading-[1.62] text-white/55 mb-[22px] max-w-[340px]">{t.foot.blurb}</p>
          <a
            href="https://www.linkedin.com/company/larsen-italiana-soc-arl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="inline-flex w-[38px] h-[38px] border border-white/20 rounded-[9px] items-center justify-center text-white/70 transition-colors duration-200 hover:bg-larsen-blue hover:text-white hover:border-larsen-blue"
          >
            <Linkedin size={17} />
          </a>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-mono text-xs tracking-[0.06em] uppercase text-white/50 mb-[18px]">{t.foot.prod}</h4>
          <div className="flex flex-col gap-[11px]">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => window.scrollTo(0, 0)}
                className="text-[14.5px] text-white/60 transition-colors duration-200 hover:text-white"
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-mono text-xs tracking-[0.06em] uppercase text-white/50 mb-[18px]">{t.foot.contact}</h4>
          <div className="flex flex-col gap-[15px] text-[14.5px] text-white/60">
            <a href="tel:+17753650376" className="flex items-start gap-3 transition-colors duration-200 hover:text-white">
              <Phone size={17} className="shrink-0 mt-[3px] text-larsen-red" />
              <span className="flex flex-col gap-[3px]">
                <span>775 365 0376</span>
                <span className="text-white/40 text-[13.5px]">0039 348 6907430</span>
              </span>
            </a>
            <a href="mailto:info@larsenitaliana.it" className="flex items-center gap-3 transition-colors duration-200 hover:text-white">
              <Mail size={17} className="shrink-0 text-larsen-red" />
              <span>info@larsenitaliana.it</span>
            </a>
            <div className="flex items-center gap-3">
              <MapPin size={17} className="shrink-0 text-larsen-red" />
              <span>Moglia, MN · Italia</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-7 py-[22px] flex flex-wrap justify-between items-center gap-3.5">
          <p className="text-[13px] text-white/45 m-0">© 2025 Larsen Italiana. {t.foot.rights}</p>
          <div className="flex gap-[26px] text-[13px]">
            <a href="#" className="text-white/45 transition-colors duration-200 hover:text-white">{t.foot.privacy}</a>
            <a href="#" className="text-white/45 transition-colors duration-200 hover:text-white">{t.foot.terms}</a>
            <a href="#" className="text-white/45 transition-colors duration-200 hover:text-white">{t.foot.cookies}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
