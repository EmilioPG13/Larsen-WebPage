import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle } from '../components/ui/icons';
import MachineImage from '../components/ui/MachineImage';
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
          <h1 className="display text-[clamp(26px,3vw,34px)] text-ink m-0 mb-3">
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
    `text-[13px] font-semibold px-3.5 h-9 inline-flex items-center border transition-colors ${
      activeState
        ? 'bg-deep text-on-deep border-deep'
        : 'border-line text-muted hover:text-ink hover:border-line-strong'
    }`;

  const filterRow = (label: string, options: string[], value: string, set: (v: string) => void) => (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-muted w-14">{label}</span>
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
        <h1 className="display text-[clamp(40px,5.4vw,68px)] text-ink m-0 mb-4">
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

      {/* separate plates: a partly filled last row must not expose a ruled background */}
      {visible.length === 0 ? (
        <div className="border border-line bg-surface px-6 sm:px-10 py-16 md:py-20 text-center">
          <h2 className="display text-[clamp(24px,3vw,32px)] text-ink m-0 mb-3">
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
                className="text-[14px] font-semibold inline-flex items-center h-12 px-5 border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep"
              >
                {t.mpage.viewAll}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((m) => {
            const ready = m.modality === 'EN_BODEGA';
            const logo = !m.image ? brandLogo(m.brand) : undefined;
            return (
              <article key={`${m.brand}|${m.model}|${m.machineId ?? ''}`} className="bg-surface border border-line flex flex-col">
                <div className="relative flex items-center justify-center bg-surface-2 px-6 pt-10 pb-6 min-h-[240px]">
                  {(m.image || logo) && (
                    <MachineImage
                      src={m.image ?? logo}
                      alt={m.image ? `${m.brand} ${m.model}` : m.brand}
                      loading="lazy"
                      decoding="async"
                      className={`object-contain ${m.image ? 'w-full max-h-[200px]' : 'w-auto max-w-[62%] max-h-[56px]'}`}
                      style={m.image ? { filter: 'drop-shadow(0 16px 14px rgba(19, 26, 79, 0.16))' } : undefined}
                    />
                  )}
                  <span
                    className={`absolute top-3 left-3 text-[12px] font-semibold px-2.5 py-1 ${
                      ready ? 'bg-deep text-on-deep' : 'bg-surface text-text2 border border-line'
                    }`}
                  >
                    {ready ? t.mpage.readyNow : t.mpage.onOrder}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1 border-t border-line-soft">
                  <h3 className="display text-[26px] text-ink m-0">{m.model}</h3>
                  <p className="text-[14px] font-semibold text-deep m-0 mt-1 mb-5">{m.brand}</p>

                  {m.units.length === 0 ? (
                    <p className="text-[13px] leading-[1.55] text-muted m-0 mb-5">{t.mpage.onOrderNote}</p>
                  ) : (
                    <>
                      <p className="text-[13px] font-semibold text-muted m-0 mb-2">{t.mpage.unitsTitle}</p>
                      <ul className="m-0 mb-5 p-0 list-none border-t border-line-soft">
                        {m.units.map((u) => (
                          <li
                            key={u.id}
                            className="flex items-center justify-between gap-3 py-2 border-b border-line-soft"
                          >
                            <span className="text-[13px] text-ink">
                              <span className="text-muted">{t.mpage.serial}</span>{' '}
                              <span className="font-mono">{u.serialNumber}</span>
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
                              className="shrink-0 h-9 px-4 inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white text-[13px] font-semibold transition-colors"
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
                        className="h-10 px-4 inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white text-[13px] font-semibold transition-colors"
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
