import { useState, useEffect } from 'react';
import ContactModal from '../components/ContactModal';
import Reveal from '../components/ui/Reveal';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { getMachines } from '../services/api';
import { machineToProduct } from '../utils/machineToProduct';
import type { Machine, Product } from '../types';

const MachinesPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.machines.title, t.meta.machines.desc);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMachines(await getMachines());
      } catch (err) {
        console.error('Error fetching machines:', err);
        setError(t.mpage.error);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openInterest = (machine: Machine) => {
    setSelectedProduct(machineToProduct(machine));
    setIsModalOpen(true);
  };

  const specsFor = (m: Machine) =>
    [
      { label: t.mpage.specLabels.width, value: m.width },
      { label: t.mpage.specLabels.speed, value: m.speed },
      { label: t.mpage.specLabels.systems, value: m.knittingSystems },
      { label: t.mpage.specLabels.gauge, value: m.gauge },
      { label: t.mpage.specLabels.yarnGuides, value: m.yarnGuides },
    ].filter((s) => s.value);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted">{t.mpage.loading}</div>;
  }

  if (error) {
    return <div className="min-h-[60vh] flex items-center justify-center text-larsen-red">{error}</div>;
  }

  return (
    <>
      <div className="max-w-[1240px] mx-auto px-7 pt-[74px] pb-20">
        <Reveal className="max-w-[640px] mb-[52px]">
          <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-4">{t.mpage.k}</div>
          <h1 className="font-serif font-medium text-[clamp(40px,5vw,64px)] tracking-[-0.025em] text-ink m-0 mb-4">{t.mpage.t}</h1>
          <p className="text-[18px] leading-[1.6] text-text2 m-0">{t.mpage.s}</p>
        </Reveal>

        <div className="flex flex-col gap-[26px]">
          {machines.map((m) => {
            const inStock = m.inStock !== false;
            return (
              <Reveal
                key={m.id}
                className="bg-surface border border-line rounded-[22px] overflow-hidden grid lg:grid-cols-[0.85fr_1.15fr] transition-all duration-300 hover:border-deep/25"
              >
                {/* Image */}
                <div
                  className="relative flex items-center justify-center px-[22px] py-[18px] min-h-[280px] overflow-hidden"
                  style={{ background: 'var(--plate)' }}
                >
                  <img
                    src={m.image}
                    alt={m.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full max-h-[320px] object-contain transition-transform duration-500 hover:scale-105"
                    style={{ filter: 'drop-shadow(0 18px 30px rgba(26,26,31,0.18))' }}
                  />
                  <div
                    className={`absolute top-[18px] left-[18px] inline-flex items-center gap-[7px] font-mono text-[11px] font-bold px-3 py-1.5 rounded-full ${
                      inStock ? 'text-[#1F8A5B]' : 'text-faint'
                    }`}
                    style={{ background: inStock ? 'rgba(31,138,91,0.12)' : 'var(--fill)' }}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full inline-block"
                      style={{ background: inStock ? '#1F8A5B' : 'var(--faint)' }}
                    />
                    {inStock ? t.mpage.stock : t.mpage.outOfStock}
                  </div>
                </div>

                {/* Content */}
                <div className="px-9 py-[34px] flex flex-col">
                  <div className="font-mono text-[11.5px] font-bold tracking-[0.05em] text-deep uppercase mb-2">{m.brand}</div>
                  <h2 className="font-serif font-semibold text-[32px] text-ink m-0 mb-3">{m.name}</h2>
                  <p className="text-[15px] leading-[1.6] text-muted m-0 mb-[22px]">{m.description}</p>

                  <div className="font-mono text-[11px] tracking-[0.06em] text-faint uppercase mb-3">{t.mpage.specs}</div>
                  <div
                    className="grid grid-cols-2 gap-px border border-line rounded-xl overflow-hidden mb-[22px]"
                    style={{ background: 'var(--line)' }}
                  >
                    {specsFor(m).map((sp, i) => (
                      <div key={i} className="bg-surface px-[15px] py-3">
                        <div className="text-[11.5px] text-faint mb-[3px]">{sp.label}</div>
                        <div className="text-sm font-semibold text-ink">{sp.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3.5 mt-auto flex-wrap">
                    <button
                      onClick={() => openInterest(m)}
                      disabled={!inStock}
                      className={`font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full transition-all duration-200 ${
                        inStock
                          ? 'bg-larsen-red hover:bg-larsen-dark-red text-white hover:-translate-y-0.5'
                          : 'bg-fill text-faint cursor-not-allowed'
                      }`}
                      style={inStock ? { boxShadow: '0 8px 20px rgba(216,30,42,0.22)' } : undefined}
                    >
                      {inStock ? t.mpage.interested : t.mpage.outOfStock}
                    </button>
                    <div className="flex flex-wrap gap-[7px]">
                      {m.capabilities.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[11.5px] font-medium text-text2 bg-fill px-[11px] py-[5px] rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} />
    </>
  );
};

export default MachinesPage;
