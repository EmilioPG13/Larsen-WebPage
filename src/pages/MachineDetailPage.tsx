import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import ContactModal from '../components/ContactModal';
import SpecSheetModal from '../components/SpecSheetModal';
import Reveal from '../components/ui/Reveal';
import { Check, MessageCircle } from '../components/ui/icons';
import { useT } from '../i18n/useT';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeMachine } from '../i18n/localizeMachine';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { getMachines } from '../services/api';
import { machineToProduct } from '../utils/machineToProduct';
import { track } from '../services/analytics';
import type { Machine, Product } from '../types';

const WHATSAPP_NUMBER = '527753650376';

const MachineDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const [rawMachine, setRawMachine] = useState<Machine | null | undefined>(undefined); // undefined = loading
  const { lang } = useLanguage();
  const machine = useMemo(
    () => (rawMachine ? localizeMachine(rawMachine, lang) : rawMachine),
    [rawMachine, lang],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [product, setProduct] = useState<Product | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const machines = await getMachines();
        setRawMachine(machines.find((m) => m.id === id) ?? null);
      } catch (err) {
        console.error('Error fetching machine:', err);
        setRawMachine(null);
      }
    })();
  }, [id]);

  useDocumentMeta(
    machine ? `${machine.name} — ${machine.brand} | Larsen Italiana` : t.detail.k,
    machine?.description,
  );

  useEffect(() => {
    if (machine) track('view_machine_detail', { machine_id: machine.id, machine_name: machine.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rawMachine on purpose: machine is a localized derivative whose identity changes with the language
  }, [rawMachine]);

  if (machine === undefined) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted">{t.mpage.loading}</div>;
  }

  if (machine === null) {
    return (
      <div className="max-w-[1240px] mx-auto px-7 py-24 text-center">
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

  const openQuote = () => {
    setProduct(machineToProduct(machine));
    setModalOpen(true);
  };

  const trustBlocks = [
    { title: t.detail.warrantyTitle, text: t.detail.warrantyText },
    { title: t.detail.financingTitle, text: t.detail.financingText },
    { title: t.detail.shippingTitle, text: t.detail.shippingText },
  ];

  return (
    <>
      <div className="max-w-[1240px] mx-auto px-7 pt-[54px] pb-20">
        <Link to="/maquinas" onClick={() => window.scrollTo(0, 0)} className="inline-block text-sm font-medium text-muted hover:text-larsen-red transition-colors mb-8">
          {t.detail.back}
        </Link>

        <div className="grid lg:grid-cols-2 gap-[50px] items-start">
          {/* Image */}
          <Reveal className="lg:sticky lg:top-[90px]">
            <div className="relative rounded-[22px] border border-line overflow-hidden flex items-center justify-center p-8 min-h-[360px]" style={{ background: 'var(--plate)' }}>
              <img
                src={machine.image}
                alt={machine.name}
                decoding="async"
                className="w-full max-h-[440px] object-contain"
                style={{ filter: 'drop-shadow(0 24px 40px rgba(26,26,31,0.22))' }}
              />
              <div
                className={`absolute top-5 left-5 inline-flex items-center gap-[7px] font-mono text-[11px] font-bold px-3 py-1.5 rounded-full ${inStock ? 'text-[#1F8A5B]' : 'text-faint'}`}
                style={{ background: inStock ? 'rgba(31,138,91,0.12)' : 'var(--fill)' }}
              >
                <span className="w-[7px] h-[7px] rounded-full inline-block" style={{ background: inStock ? '#1F8A5B' : 'var(--faint)' }} />
                {inStock ? t.detail.stock : t.detail.outOfStock}
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <div>
            <Reveal>
              <div className="font-mono text-[11.5px] font-bold tracking-[0.05em] text-deep uppercase mb-2">{machine.brand}</div>
              <h1 className="font-serif font-medium text-[clamp(36px,4.6vw,56px)] leading-[1.02] tracking-[-0.02em] text-ink m-0 mb-4">{machine.name}</h1>
              <p className="text-[16.5px] leading-[1.6] text-text2 m-0 mb-6">{machine.description}</p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-9">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_whatsapp', { source: 'machine_detail', machine_id: machine.id })}
                  className="inline-flex items-center gap-2 bg-[#1F8A5B] hover:brightness-110 text-white font-semibold text-[15px] px-6 py-[13px] rounded-full transition-all duration-200 hover:-translate-y-0.5"
                >
                  <MessageCircle size={18} />{t.detail.ctaWhatsapp}
                </a>
                <button onClick={openQuote} className="bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15px] px-6 py-[13px] rounded-full transition-all duration-200 hover:-translate-y-0.5" style={{ boxShadow: '0 8px 20px rgba(216,30,42,0.22)' }}>
                  {t.detail.ctaQuote}
                </button>
                <button onClick={() => setSheetOpen(true)} className="bg-transparent border-[1.5px] border-line-strong text-ink font-semibold text-[15px] px-6 py-[13px] rounded-full transition-colors duration-200 hover:border-deep hover:bg-deep/5">
                  {t.detail.download}
                </button>
              </div>
            </Reveal>

            {/* Specs */}
            <Reveal className="mb-9">
              <div className="font-mono text-[11px] tracking-[0.06em] text-faint uppercase mb-3">{t.detail.specs}</div>
              <div className="grid grid-cols-2 gap-px border border-line rounded-xl overflow-hidden" style={{ background: 'var(--line)' }}>
                {specs.map((sp, i) => (
                  <div key={i} className="bg-surface px-[15px] py-3">
                    <div className="text-[11.5px] text-faint mb-[3px]">{sp.label}</div>
                    <div className="text-sm font-semibold text-ink">{sp.value}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* What's included */}
            <Reveal className="mb-9">
              <h2 className="font-serif font-semibold text-[22px] text-ink m-0 mb-4">{t.detail.includedTitle}</h2>
              <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
                {t.detail.includedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-text2">
                    <span className="shrink-0 mt-1 text-[#1F8A5B]"><Check size={16} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Trust blocks */}
            <div className="grid sm:grid-cols-3 gap-3.5">
              {trustBlocks.map((b, i) => (
                <Reveal key={i} className="bg-surface-2 border border-line rounded-[14px] p-5">
                  <h3 className="font-serif font-semibold text-base text-ink m-0 mb-1.5">{b.title}</h3>
                  <p className="text-[13px] leading-[1.5] text-muted m-0">{b.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} product={product} />
      <SpecSheetModal machine={machine} isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
};

export default MachineDetailPage;
