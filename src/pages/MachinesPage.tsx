import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ContactModal from '../components/ContactModal';
import { useT } from '../i18n/useT';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeMachine } from '../i18n/localizeMachine';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { getMachines } from '../services/api';
import { machineToProduct } from '../utils/machineToProduct';
import type { Machine, Product } from '../types';

const PLATE = 'max-w-[1280px] mx-auto px-7';
const ALL = '__all__';

const MachinesPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.machines.title, t.meta.machines.desc);
  const navigate = useNavigate();
  const [rawMachines, setRawMachines] = useState<Machine[]>([]);
  const { lang } = useLanguage();
  const machines = useMemo(
    () => rawMachines.map((m) => localizeMachine(m, lang)),
    [rawMachines, lang],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  // seed the brand filter from ?brand= (deep link from the Brands page)
  const [params] = useSearchParams();
  const [brand, setBrand] = useState(() => params.get('brand') ?? ALL);
  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setRawMachines(await getMachines());
      } catch (err) {
        console.error('Error fetching machines:', err);
        setError(t.mpage.error);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brandOptions = useMemo(
    () => [...new Set(rawMachines.map((m) => m.brand))].sort(),
    [rawMachines],
  );

  // A deep-linked ?brand= that matches no stocked machine is kept, not reset —
  // the grid then shows a named empty state instead of a silent full list.
  // Secondary axis: the short `category` label, not the verbose `type` sentence.
  const categoryOptions = useMemo(
    () => [...new Set(machines.map((m) => m.category).filter(Boolean))].sort(),
    [machines],
  );

  const visible = machines.filter(
    (m) =>
      (brand === ALL || m.brand === brand) &&
      (category === ALL || m.category === category),
  );

  const openInterest = (machine: Machine) => {
    setSelectedProduct(machineToProduct(machine));
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted">{t.mpage.loading}</div>;
  }

  if (error) {
    return <div className="min-h-[60vh] flex items-center justify-center text-larsen-red">{error}</div>;
  }

  const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';
  const toggle = (activeState: boolean) =>
    `${kicker} px-3 h-9 inline-flex items-center border transition-colors ${
      activeState
        ? 'bg-deep text-white border-deep'
        : 'border-line text-muted hover:text-ink hover:border-line-strong'
    }`;

  return (
    <>
      <div className={`${PLATE} pt-14 md:pt-[72px] pb-14 md:pb-[88px]`}>
        <header className="max-w-[640px] mb-12">
          <div className={`${kicker} text-deep mb-4`}>{t.mpage.k}</div>
          <h1 className="font-serif font-medium text-[clamp(38px,5vw,60px)] tracking-[-0.01em] text-ink m-0 mb-4">
            {t.mpage.t}
          </h1>
          <p className="text-[15px] leading-[1.6] text-text2 m-0">{t.mpage.s}</p>
        </header>

        {/* filters — ruled toggle cells, no pills */}
        {(brandOptions.length > 1 || categoryOptions.length > 1) && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              className={toggle(brand === ALL && category === ALL)}
              onClick={() => { setBrand(ALL); setCategory(ALL); }}
            >
              {lang === 'es' ? 'Todas' : 'All'}
            </button>
            {brandOptions.map((b) => (
              <button key={b} className={toggle(brand === b)} onClick={() => setBrand(brand === b ? ALL : b)}>
                {b}
              </button>
            ))}
            {categoryOptions.length > 1 &&
              categoryOptions.map((c) => (
                <button key={c} className={toggle(category === c)} onClick={() => setCategory(category === c ? ALL : c)}>
                  {c}
                </button>
              ))}
          </div>
        )}

        {/* ruled grid — 1px gaps read as a spec table */}
        {visible.length === 0 ? (
          <div className="border border-line bg-surface px-6 sm:px-10 py-16 md:py-20 text-center">
            <h2 className="font-serif font-medium text-[clamp(22px,3vw,30px)] tracking-[-0.01em] text-ink m-0 mb-3">
              {t.mpage.emptyTitle}
            </h2>
            <p className="text-[14px] leading-[1.6] text-muted max-w-[46ch] mx-auto m-0 mb-8">
              {brand !== ALL ? t.mpage.emptyBrand.replace('{brand}', brand) : t.mpage.emptyGeneric}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => { window.scrollTo(0, 0); navigate('/cotizacion'); }}
                className="inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 px-7 transition-colors"
              >
                {t.detail.ctaQuote}
              </button>
              <button
                onClick={() => { setBrand(ALL); setCategory(ALL); }}
                className={`${kicker} inline-flex items-center h-12 px-5 border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep`}
              >
                {t.mpage.viewAll}
              </button>
            </div>
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
          {visible.map((m) => {
            const inStock = m.inStock !== false;
            const meta = [
              { k: t.mpage.specLabels.width, v: m.width },
              { k: t.mpage.specLabels.speed, v: m.speed },
              { k: t.mpage.specLabels.gauge, v: m.gauge },
            ].filter((s) => s.v);
            return (
              <article key={m.id} className="bg-surface flex flex-col">
                <div className="relative flex items-center justify-center bg-surface-2 px-6 pt-8 pb-4 min-h-[220px]">
                  <img
                    src={m.image}
                    alt={`${m.brand} ${m.name}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-[200px] object-contain"
                  />
                  <span
                    className={`absolute top-3 left-3 ${kicker} px-2 py-1 border ${
                      inStock ? 'text-deep border-deep-line' : 'text-faint border-line'
                    }`}
                  >
                    {inStock ? t.mpage.stock : t.mpage.outOfStock}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1 border-t border-line-soft">
                  <div className={`${kicker} text-deep mb-2`}>{m.brand}</div>
                  <h3 className="font-serif font-medium text-[22px] leading-tight text-ink m-0 mb-4">{m.name}</h3>

                  <dl className="m-0 mb-5">
                    {meta.map((s) => (
                      <div key={s.k} className="flex justify-between gap-4 py-1.5 border-b border-line-soft last:border-b-0">
                        <dt className={`${kicker} text-muted`}>{s.k}</dt>
                        <dd className="m-0 text-[13px] text-ink text-right">{s.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <Link
                      to={`/maquinas/${m.id}`}
                      onClick={() => window.scrollTo(0, 0)}
                      className="text-[13px] font-semibold text-ink underline underline-offset-4 decoration-line-strong hover:decoration-deep hover:text-deep transition-colors"
                    >
                      {t.detail.view} →
                    </Link>
                    <button
                      onClick={() => openInterest(m)}
                      disabled={!inStock}
                      className={`${kicker} h-9 px-3 border transition-colors ${
                        inStock
                          ? 'border-line-strong text-ink hover:border-deep hover:text-deep'
                          : 'border-line text-faint cursor-not-allowed'
                      }`}
                    >
                      {inStock ? t.mpage.interested : t.mpage.outOfStock}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        )}
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} />
    </>
  );
};

export default MachinesPage;
