import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SpecSheetModal from '../components/SpecSheetModal';
import { Check, MessageCircle } from '../components/ui/icons';
import MachineImage from '../components/ui/MachineImage';
import { useT } from '../i18n/useT';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeMachine } from '../i18n/localizeMachine';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { getCatalog, getMachines } from '../services/api';
import { track } from '../services/analytics';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';
import { unitQuoteHref } from '../utils/unitQuote';
import type { CatalogModel, Machine } from '../types';

const PLATE = 'max-w-[1280px] mx-auto px-7';

const MachineDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { lang } = useLanguage();

  const [rawAll, setRawAll] = useState<Machine[] | null>(null); // null = loading
  const rawMachine: Machine | null | undefined =
    rawAll === null ? undefined : rawAll.find((m) => m.id === id) ?? null;

  const machine = useMemo(
    () => (rawMachine ? localizeMachine(rawMachine, lang) : rawMachine),
    [rawMachine, lang],
  );
  const related = useMemo(
    () =>
      rawAll && rawMachine
        ? rawAll.filter((m) => m.brand === rawMachine.brand && m.id !== rawMachine.id)
            .slice(0, 3)
            .map((m) => localizeMachine(m, lang))
        : [],
    [rawAll, rawMachine, lang],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  // Units of this model that are in stock right now. Optional: when the catalog
  // cannot be reached the page simply shows no unit list.
  const [stock, setStock] = useState<CatalogModel | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const catalog = await getCatalog();
        setStock(catalog.find((m) => m.machineId === id && m.units.length > 0) ?? null);
      } catch {
        setStock(null);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setRawAll(await getMachines());
      } catch (err) {
        console.error('Error fetching machine:', err);
        setRawAll([]);
      }
    })();
  }, []);

  useDocumentMeta(
    machine ? `${machine.name} — ${machine.brand} | Larsen Italiana` : t.detail.k,
    machine?.description,
  );

  useEffect(() => {
    if (machine) {
      track('view_machine_detail', {
        machine_id: machine.id,
        machine_name: machine.name,
        brand: machine.brand,
        model: machine.name,
        gauge: machine.gauge,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rawMachine identity is stable per id; localized `machine` is not
  }, [rawMachine]);

  if (machine === undefined) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted">{t.mpage.loading}</div>;
  }

  if (machine === null) {
    return (
      <div className={`${PLATE} py-24 text-center`}>
        <p className="text-muted mb-6">{t.notFound.s}</p>
        <Link to="/maquinas" className="text-larsen-red font-semibold">{t.detail.back}</Link>
      </div>
    );
  }

  const inStock = machine.inStock !== false;
  const specs = [
    { label: t.mpage.specLabels.width, value: machine.width },
    { label: t.mpage.specLabels.speed, value: machine.speed },
    { label: t.mpage.specLabels.systems, value: machine.knittingSystems },
    { label: t.mpage.specLabels.gauge, value: machine.gauge },
    { label: t.mpage.specLabels.yarnGuides, value: machine.yarnGuides },
    { label: t.mpage.specLabels.software, value: machine.software },
    { label: t.mpage.specLabels.power, value: machine.power },
    { label: t.mpage.specLabels.type, value: machine.type },
  ].filter((s) => s.value);

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`${t.detail.waPrefill} ${machine.name}`)}`;
  const quoteHref = `/cotizacion?machine=${encodeURIComponent(machine.name)}`;

  const ghostBtn =
    'inline-flex items-center gap-2 h-12 px-5 border border-line-strong text-ink text-[14px] font-semibold transition-colors hover:border-deep hover:text-deep';

  return (
    <>
      <div className={`${PLATE} pt-10 md:pt-14 pb-14 md:pb-[88px]`}>
        <Link
          to="/maquinas"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block text-[13px] font-medium text-muted hover:text-deep transition-colors mb-10"
        >
          {t.detail.back}
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* IMAGE — sticky on desktop */}
          <div className="lg:sticky lg:top-24 order-first lg:order-last">
            <div className="relative bg-surface-2 border border-line flex items-center justify-center p-8 min-h-[320px]">
              <MachineImage
                src={machine.image}
                alt={`${machine.brand} ${machine.name}`}
                decoding="async"
                className="w-full max-h-[460px] object-contain"
                style={{ filter: 'drop-shadow(0 24px 20px rgba(19, 26, 79, 0.18))' }}
              />
              <span
                className={`absolute top-4 left-4 text-[12px] font-semibold px-2.5 py-1 ${
                  inStock ? 'bg-deep text-on-deep' : 'bg-surface text-text2 border border-line'
                }`}
              >
                {inStock ? t.detail.stock : t.detail.outOfStock}
              </span>
            </div>
          </div>

          {/* SPECS + CTA */}
          <div>
            <h1 className="display text-[clamp(38px,4.8vw,62px)] text-ink m-0 mb-1">
              {machine.name}
            </h1>
            <p className="text-[17px] font-semibold text-deep m-0 mb-4">{machine.brand}</p>
            <p className="text-[15px] leading-[1.6] text-text2 max-w-[52ch] m-0 mb-8">{machine.description}</p>

            <h2 className="display text-[22px] text-ink m-0 mb-3">{t.detail.specs}</h2>
            <dl className="m-0 mb-8 border-t border-line">
              {specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[auto_1fr] gap-6 py-3 border-b border-line-soft">
                  <dt className="text-[13px] font-semibold text-muted pt-0.5">{s.label}</dt>
                  <dd className="m-0 text-[15px] text-ink text-right">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => { window.scrollTo(0, 0); navigate(quoteHref); }}
                className="inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15px] h-12 px-8 transition-colors"
              >
                {t.detail.ctaQuote}
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('click_whatsapp', { source: 'machine_detail', machine_id: machine.id })}
                className={ghostBtn}
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                {t.detail.ctaWhatsapp}
              </a>
              <button onClick={() => setSheetOpen(true)} className={ghostBtn}>
                {t.detail.download}
              </button>
            </div>

            {stock && (
              <section className="mb-10">
                <h2 className="display text-[22px] text-ink m-0 mb-4">{t.mpage.unitsTitle}</h2>
                <ul className="m-0 p-0 list-none border-t border-line">
                  {stock.units.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 py-3 border-b border-line-soft">
                      <span className="text-[14px] text-ink">
                        <span className="text-muted">{t.mpage.serial}</span>{' '}
                        <span className="font-mono">{u.serialNumber}</span>
                        <span className="text-muted"> · {t.mpage.gauge} {u.gauge}</span>
                      </span>
                      <Link
                        to={unitQuoteHref(stock, u)}
                        onClick={() => {
                          track('select_unit', {
                            brand: stock.brand,
                            model: stock.model,
                            gauge: u.gauge,
                            serial_number: u.serialNumber,
                          });
                          window.scrollTo(0, 0);
                        }}
                        aria-label={`${t.mpage.quoteUnit} ${stock.model} ${t.mpage.serial} ${u.serialNumber}`}
                        className="shrink-0 h-9 px-4 inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white text-[13px] font-semibold transition-colors"
                      >
                        {t.mpage.quoteUnit}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <h2 className="display text-[22px] text-ink m-0 mb-4">{t.detail.includedTitle}</h2>
            <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
              {t.detail.includedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.55] text-text2">
                  <span className="shrink-0 mt-0.5 text-deep"><Check size={15} strokeWidth={2} /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RELATED — same brand, ruled row */}
        {related.length > 0 && (
          <section className="mt-16 md:mt-[88px] pt-10 border-t border-line">
            <h2 className="display text-[24px] text-ink m-0 mb-6">{t.detail.related}</h2>
            <div
              className={`grid gap-px bg-line border border-line ${
                related.length >= 3
                  ? 'sm:grid-cols-2 lg:grid-cols-3'
                  : related.length === 2
                    ? 'sm:grid-cols-2'
                    : 'max-w-[420px]'
              }`}
            >
              {related.map((m) => (
                <Link
                  key={m.id}
                  to={`/maquinas/${m.id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-surface p-6 flex flex-col group"
                >
                  <div className="bg-surface-2 flex items-center justify-center h-[150px] mb-4">
                    <MachineImage src={m.image} alt={m.name} loading="lazy" decoding="async" className="max-h-[130px] max-w-full object-contain" />
                  </div>
                  <h3 className="display text-[22px] text-ink m-0 group-hover:text-deep transition-colors">{m.name}</h3>
                  <p className="text-[14px] font-semibold text-deep m-0 mt-1">{m.brand}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <SpecSheetModal machine={machine} isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
};

export default MachineDetailPage;
