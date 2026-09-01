import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { useLanguage } from '../i18n/LanguageContext';
import { brands } from '../data/brands';

const PLATE = 'max-w-[1280px] mx-auto px-7';
const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';

const BrandsPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.brands.title, t.meta.brands.desc);
  const { lang } = useLanguage();

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className={`${PLATE} pt-14 md:pt-[72px] pb-10 md:pb-14`}>
          <div className={`${kicker} text-deep mb-4`}>{t.bpage.k}</div>
          <h1 className="font-serif font-medium text-[clamp(38px,5vw,56px)] leading-[1.02] tracking-[-0.01em] text-ink m-0 mb-4">
            {t.bpage.t}
          </h1>
          <p className="text-[15px] leading-[1.6] text-text2 max-w-[52ch] m-0">{t.bpage.s}</p>
        </div>
      </section>

      {/* separate plates — cards lift on hover, so 24px gaps rather than a 1px ruled grid */}
      <div className={`${PLATE} py-14 md:py-[88px]`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((b) => (
            <Link
              key={b.name}
              to={`/maquinas?brand=${encodeURIComponent(b.name)}`}
              onClick={() => window.scrollTo(0, 0)}
              data-brand-card=""
              className="group bg-surface border border-line flex flex-col"
            >
              <div className="h-[132px] flex items-center justify-center border-b border-line-soft bg-surface-2 overflow-hidden px-6">
                <img
                  src={b.image}
                  alt={b.name}
                  loading="lazy"
                  decoding="async"
                  data-brand-logo=""
                  className="w-auto max-w-[64%] object-contain"
                  style={{ maxHeight: `${60 * (b.logoScale ?? 1)}px` }}
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className={`${kicker} text-faint`}>{b.origin[lang]}</div>
                <h2 className="font-serif font-medium text-[22px] text-ink m-0 mt-2 mb-2 transition-colors group-hover:text-deep">
                  {b.name}
                </h2>
                <p className="text-[13.5px] leading-[1.6] text-muted m-0">{b.blurb[lang]}</p>
                <span
                  className={`${kicker} text-ink mt-4 inline-flex items-center gap-1.5 transition-colors group-hover:text-deep`}
                >
                  {t.bpage.cta} <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default BrandsPage;
