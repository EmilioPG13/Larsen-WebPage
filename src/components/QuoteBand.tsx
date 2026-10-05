import { Link, useLocation } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { track } from '../services/analytics';
import { Whatsapp, Phone } from './ui/icons';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';

// Pages that already end on a quote action of their own.
const HIDDEN_ON = ['/cotizacion', '/nosotros'];

/** Closing call to action shown above the footer: one primary action, two direct lines. */
const QuoteBand = () => {
  const t = useT();
  const { pathname } = useLocation();
  const known = ['/', '/maquinas', '/marcas'].includes(pathname) || pathname.startsWith('/maquinas/');
  if (!known || HIDDEN_ON.includes(pathname)) return null;

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsapp.prefill)}`;
  const direct =
    'inline-flex items-center justify-center gap-2 h-12 px-5 border border-white/35 text-white font-semibold text-[14px] transition-colors hover:bg-white hover:text-larsen-blue';

  return (
    <section className="bg-larsen-blue text-white" aria-labelledby="quote-band-title">
      <div className="max-w-[1280px] mx-auto px-7 py-14 md:py-[72px] grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-14 items-center">
        <div>
          <h2 id="quote-band-title" className="display text-[clamp(30px,4vw,48px)] m-0 mb-3">
            {t.cend.t}
          </h2>
          <p className="text-[15px] leading-[1.6] text-white/80 max-w-[48ch] m-0">{t.cend.s}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <Link
            to="/cotizacion"
            onClick={() => {
              track('click_quote_cta', { source: 'closing_band' });
              window.scrollTo(0, 0);
            }}
            className="inline-flex items-center justify-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15px] h-12 px-8 transition-colors"
          >
            {t.cend.b}
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_whatsapp', { source: 'closing_band' })}
            className={direct}
          >
            <Whatsapp size={18} />
            WhatsApp
          </a>
          <a
            href="tel:+527753650376"
            onClick={() => track('click_phone', { source: 'closing_band' })}
            className={direct}
          >
            <Phone size={16} />
            +52 775 365 0376
          </a>
        </div>
      </div>
    </section>
  );
};

export default QuoteBand;
