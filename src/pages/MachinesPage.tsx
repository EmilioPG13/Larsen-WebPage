import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle } from '../components/ui/icons';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { getCatalog } from '../services/api';
import { track } from '../services/analytics';
import { brands } from '../data/brands';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';
import { modelQuoteHref, unitQuoteHref } from '../utils/unitQuote';
import type { CatalogModel } from '../types';

const PLATE = 'max-w-[1280px] mx-auto px-7';
const ALL = '__all__';
const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';

const byGauge = (a: string, b: string) => parseFloat(a) - parseFloat(b) || a.localeCompare(b);
const brandLogo = (brand: string) => brands.find((b) => b.name === brand)?.image;

const MachinesPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.machines.title, t.meta.machines.desc);
  const [catalog, setCatalog] = useState<CatalogModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // seed the brand filter from ?brand= (deep link from the Brands page)
  const [params] = useSearchParams();
  const [brand, setBrand] = useState(() => params.get('brand') ?? ALL);
  const [gauge, setGauge] = useState(ALL);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setCatalog(await getCatalog());
      } catch (err) {
        console.error('Error fetching catalog:', err);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const brandOptions = useMemo(() => [...new Set(catalog.map((m) => m.brand))].sort(), [catalog]);
  const gaugeOptions = useMemo(
    () => [...new Set(catalog.flatMap((m) => m.gauges))].sort(byGauge),
    [catalog],
  );

  // A deep-linked ?brand= that matches no stocked model is kept, not reset —
  // the grid then shows a named empty state instead of a silent full list.
  const visible = catalog.filter(
    (m) => (brand === ALL || m.brand === brand) && (gauge === ALL || m.gauges.includes(gauge)),
  );
  const filtering = brand !== ALL || gauge !== ALL;
  const clearFilters = () => {
    setBrand(ALL);
    setGauge(ALL);
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted">{t.mpage.loading}</div>;
  }

  if (failed) {
    const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.mpage.downWaPrefill)}`;
    return (
      <div className={`${PLATE} py-24`}>
        <div className="border border-line bg-surface px-6 sm:px-10 py-16 text-center">
          <h1 className="font-serif font-medium text-[clamp(24px,3vw,32px)] tracking-[-0.01em] text-ink m-0 mb-3">
            {t.mpage.downTitle}
          </h1>
          <p className="text-[14px] leading-[1.6] text-muted max-w-[46ch] mx-auto m-0 mb-8">{t.mpage.downBody}</p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('click_whatsapp', { source: 'catalog_unavailable' })}
            className="inline-flex items-center gap-2 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 px-7 transition-colors"
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            {t.mpage.downWhatsapp}
          </a>
        </div>
      </div>
    );
  }

  const toggle = (activeState: boolean) =>
    `${kicker} px-3 h-9 inline-flex items-center border transition-colors ${
      activeState
        ? 'bg-deep text-white border-deep'
        : 'border-line text-muted hover:text-ink hover:border-line-strong'
    }`;

  const filterRow = (label: string, options: string[], value: string, set: (v: string) => void) => (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className={`${kicker} text-faint w-14`}>{label}</span>
      <button className={toggle(value === ALL)} aria-pressed={value === ALL} onClick={() => set(ALL)}>
        {t.mpage.all}
      </button>
      {options.map((o) => (
        <button
          key={o}
          className={toggle(value === o)}
          aria-pressed={value === o}
          onClick={() => set(value === o ? ALL : o)}
        >
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`${PLATE} pt-14 md:pt-[72px] pb-14 md:pb-[88px]`}>
      <header className="max-w-[640px] mb-12">
        <div className={`${kicker} text-deep mb-4`}>{t.mpage.k}</div>
        <h1 className="font-serif font-medium text-[clamp(38px,5vw,60px)] tracking-[-0.01em] text-ink m-0 mb-4">
          {t.mpage.t}
        </h1>
        <p className="text-[15px] leading-[1.6] text-text2 m-0">{t.mpage.s}</p>
      </header>

      {/* filters — ruled toggle cells, no pills */}
      {(brandOptions.length > 1 || gaugeOptions.length > 1 || filtering) && (
        <div className="flex flex-col gap-3 mb-8">
          {(brandOptions.length > 1 || brand !== ALL) && filterRow(t.mpage.filterBrand, brandOptions, brand, setBrand)}
          {gaugeOptions.length > 1 && filterRow(t.mpage.filterGauge, gaugeOptions, gauge, setGauge)}
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
            <Link
              to="/cotizacion"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 px-7 transition-colors"
            >
              {t.detail.ctaQuote}
            </Link>
            {filtering && (
              <button
                onClick={clearFilters}
                className={`${kicker} inline-flex items-center h-12 px-5 border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep`}
              >
                {t.mpage.viewAll}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
          {visible.map((m) => {
            const ready = m.modality === 'EN_BODEGA';
            const logo = !m.image ? brandLogo(m.brand) : undefined;
            return (
              <article key={`${m.brand}|${m.model}|${m.machineId ?? ''}`} className="bg-surface flex flex-col">
                <div className="relative flex items-center justify-center bg-surface-2 px-6 pt-8 pb-4 min-h-[220px]">
                  {(m.image || logo) && (
                    <img
                      src={m.image ?? logo}
                      alt={m.image ? `${m.brand} ${m.model}` : m.brand}
                      loading="lazy"
                      decoding="async"
                      className={`w-full object-contain ${m.image ? 'max-h-[200px]' : 'max-h-[72px]'}`}
                    />
                  )}
                  <span
                    className={`absolute top-3 left-3 ${kicker} px-2 py-1 border ${
                      ready ? 'text-deep border-deep-line' : 'text-faint border-line'
                    }`}
                  >
                    {ready ? t.mpage.readyNow : t.mpage.onOrder}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1 border-t border-line-soft">
                  <div className={`${kicker} text-deep mb-2`}>{m.brand}</div>
                  <h3 className="font-serif font-medium text-[22px] leading-tight text-ink m-0 mb-4">{m.model}</h3>

                  {m.units.length === 0 ? (
                    <p className="text-[13px] leading-[1.55] text-muted m-0 mb-5">{t.mpage.onOrderNote}</p>
                  ) : (
                    <>
                      <div className={`${kicker} text-muted mb-2`}>{t.mpage.unitsTitle}</div>
                      <ul className="m-0 mb-5 p-0 list-none border-t border-line-soft">
                        {m.units.map((u) => (
                          <li
                            key={u.id}
                            className="flex items-center justify-between gap-3 py-2 border-b border-line-soft"
                          >
                            <span className="text-[13px] text-ink">
                              <span className={`${kicker} text-muted`}>{t.mpage.serial}</span> {u.serialNumber}
                              <span className="text-muted"> · {t.mpage.gauge} {u.gauge}</span>
                            </span>
                            <Link
                              to={unitQuoteHref(m, u)}
                              onClick={() => {
                                track('select_unit', {
                                  brand: m.brand,
                                  model: m.model,
                                  gauge: u.gauge,
                                  serial_number: u.serialNumber,
                                });
                                window.scrollTo(0, 0);
                              }}
                              aria-label={`${t.mpage.quoteUnit} ${m.model} ${t.mpage.serial} ${u.serialNumber}`}
                              className={`${kicker} shrink-0 h-8 px-3 inline-flex items-center border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep`}
                            >
                              {t.mpage.quoteUnit}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    {m.machineId ? (
                      <Link
                        to={`/maquinas/${m.machineId}`}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-[13px] font-semibold text-ink underline underline-offset-4 decoration-line-strong hover:decoration-deep hover:text-deep transition-colors"
                      >
                        {t.detail.view} →
                      </Link>
                    ) : (
                      <span />
                    )}
                    {m.units.length === 0 && (
                      <Link
                        to={modelQuoteHref(m)}
                        onClick={() => window.scrollTo(0, 0)}
                        className={`${kicker} h-9 px-3 inline-flex items-center border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep`}
                      >
                        {t.mpage.quoteModel}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MachinesPage;
