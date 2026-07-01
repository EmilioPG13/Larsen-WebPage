import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ContactModal from '../components/ContactModal';
import Reveal from '../components/ui/Reveal';
import Stat from '../components/ui/Stat';
import { useT } from '../i18n/useT';
import { brands } from '../data/brands';
import { getMachines } from '../services/api';
import { machineToProduct } from '../utils/machineToProduct';
import type { Machine, Product } from '../types';

const HomePage = () => {
  const t = useT();
  const navigate = useNavigate();
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

  const featured = machines.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted">{t.mpage.loading}</div>
    );
  }

  return (
    <>
      {/* HERO */}
      <section className="relative max-w-[1240px] mx-auto px-7 pt-[84px] pb-[70px]">
        <div
          className="absolute top-[30px] -right-10 font-serif font-medium leading-[0.8] tracking-[-0.03em] pointer-events-none select-none z-0 text-[clamp(120px,20vw,300px)]"
          style={{ color: 'var(--ghost)' }}
        >
          1964
        </div>
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-[52px] items-center relative z-[1]">
          <div>
            <div
              data-rise=""
              className="inline-flex items-center gap-[9px] font-mono text-xs tracking-[0.04em] text-larsen-red uppercase mb-[26px]"
              style={{ animationDelay: '.05s' }}
            >
              <span className="w-[26px] h-px bg-larsen-red inline-block" />
              {t.hero.tag}
            </div>
            <h1 className="font-serif font-medium text-[clamp(48px,6.4vw,86px)] leading-[0.98] tracking-[-0.025em] text-ink m-0 mb-[26px]">
              <span data-rise="" className="block" style={{ animationDelay: '.12s' }}>{t.hero.t1}</span>
              <span data-rise="" className="block italic text-deep" style={{ animationDelay: '.24s' }}>{t.hero.em}</span>
            </h1>
            <p data-rise="" className="text-[18px] leading-[1.62] text-text2 max-w-[480px] m-0 mb-[34px]" style={{ animationDelay: '.36s' }}>
              {t.hero.sub}
            </p>
            <div data-rise="" className="flex flex-wrap gap-3.5" style={{ animationDelay: '.48s' }}>
              <Link
                to="/maquinas"
                onClick={() => window.scrollTo(0, 0)}
                className="bg-larsen-blue text-white font-semibold text-[15px] px-7 py-[15px] rounded-full transition-transform duration-200 hover:-translate-y-0.5"
                style={{ boxShadow: '0 8px 22px rgba(40,50,123,0.26)' }}
              >
                {t.hero.c1}
              </Link>
              <Link
                to="/cotizacion"
                onClick={() => window.scrollTo(0, 0)}
                className="bg-transparent text-ink font-semibold text-[15px] px-7 py-[15px] rounded-full border-[1.5px] border-line-strong transition-colors duration-200 hover:border-larsen-red hover:bg-larsen-red/5"
              >
                {t.hero.c2}
              </Link>
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute inset-[8%_6%]"
              style={{ background: 'radial-gradient(circle at 50% 45%, rgba(40,50,123,0.10), transparent 68%)', filter: 'blur(8px)' }}
            />
            <div className="relative lz-float">
              <img
                src="/images/machines/ARIES3.png"
                alt="Steiger Aries.3"
                className="w-full max-w-[540px] mx-auto block object-contain"
                style={{ filter: 'drop-shadow(0 30px 50px rgba(26,26,31,0.22))' }}
              />
            </div>
            <div
              className="absolute bottom-1.5 left-1.5 bg-surface border border-line rounded-[14px] px-4 py-3"
              style={{ boxShadow: '0 14px 34px rgba(26,26,31,0.12)' }}
            >
              <div className="font-mono text-[10.5px] tracking-[0.06em] text-faint uppercase">Steiger</div>
              <div className="font-serif text-[19px] font-semibold text-ink">Aries.3</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-line bg-surface-2">
        <div className="max-w-[1240px] mx-auto px-7 py-[38px] grid grid-cols-2 md:grid-cols-4 gap-6">
          {t.stats.map((s, i) => (
            <Stat key={i} to={s.to} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* BRANDS STRIP */}
      <section className="max-w-[1240px] mx-auto px-7 pt-[66px] pb-[30px]">
        <Reveal className="text-center mb-[38px]">
          <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-3.5">{t.brands.k}</div>
          <h2 className="font-serif font-medium text-[clamp(28px,3.4vw,40px)] tracking-[-0.02em] text-ink m-0 mb-2.5">{t.brands.t}</h2>
          <p className="text-base text-muted m-0 max-w-[520px] mx-auto">{t.brands.s}</p>
        </Reveal>
        <Reveal className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {brands.map((b) => (
            <div
              key={b.name}
              className="border border-line rounded-2xl h-28 flex items-center justify-center px-6 overflow-hidden transition-all duration-300 hover:border-larsen-red/40 hover:-translate-y-[3px]"
              style={{ background: 'var(--logo-bg)' }}
            >
              <img src={b.image} alt={b.name} className="lz-logo max-w-full max-h-[54px] object-contain" />
            </div>
          ))}
        </Reveal>
      </section>

      {/* FEATURED MACHINES */}
      {featured.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-7 py-14">
          <Reveal className="flex items-end justify-between gap-6 mb-[38px] flex-wrap">
            <div>
              <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-3.5">{t.feat.k}</div>
              <h2 className="font-serif font-medium text-[clamp(30px,3.6vw,44px)] tracking-[-0.02em] text-ink m-0 mb-2">{t.feat.t}</h2>
              <p className="text-base text-muted m-0 max-w-[440px]">{t.feat.s}</p>
            </div>
            <Link
              to="/maquinas"
              onClick={() => window.scrollTo(0, 0)}
              className="bg-transparent border-[1.5px] border-line-strong text-ink font-semibold text-sm px-[22px] py-3 rounded-full transition-colors duration-200 hover:border-deep hover:bg-deep/5"
            >
              {t.feat.cta} →
            </Link>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
            {featured.map((m) => (
              <Reveal
                key={m.id}
                as="button"
                className="text-left bg-surface border border-line rounded-[18px] overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:border-deep/25"
                style={{ boxShadow: 'none' }}
              >
                <div
                  className="relative px-[18px] py-3.5 flex items-center justify-center h-[210px] overflow-hidden"
                  style={{ background: 'var(--plate)' }}
                  onClick={() => openInterest(m)}
                >
                  <img src={m.image} alt={m.name} className="w-full h-full object-contain transition-transform duration-500 hover:scale-105" />
                  <div className="absolute top-3.5 left-3.5 font-mono text-[10.5px] font-bold tracking-[0.05em] text-deep bg-white/85 px-2.5 py-[5px] rounded-full uppercase">
                    {m.brand}
                  </div>
                </div>
                <div className="p-[22px] pt-[22px] pb-6 flex flex-col flex-1" onClick={() => openInterest(m)}>
                  <h3 className="font-serif font-semibold text-2xl text-ink m-0 mb-2.5">{m.name}</h3>
                  <p className="text-[14.5px] leading-[1.55] text-muted m-0 mb-4 flex-1 line-clamp-3">{m.description}</p>
                  <div className="flex flex-wrap gap-[7px]">
                    {m.capabilities.slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-[11.5px] font-medium text-text2 bg-fill px-[11px] py-[5px] rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {error && featured.length === 0 && (
        <div className="max-w-[1240px] mx-auto px-7 py-10 text-center text-muted">{error}</div>
      )}

      {/* HOW WE WORK */}
      <section className="max-w-[1240px] mx-auto px-7 py-14">
        <Reveal className="text-center mb-[46px]">
          <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-3.5">{t.how.k}</div>
          <h2 className="font-serif font-medium text-[clamp(30px,3.6vw,44px)] tracking-[-0.02em] text-ink m-0 mb-2.5">{t.how.t}</h2>
          <p className="text-base text-muted m-0 mx-auto max-w-[520px]">{t.how.s}</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-[22px]">
          {t.how.steps.map((step) => (
            <Reveal key={step.n} className="px-[26px] py-[30px] border-t-2 border-deep bg-surface-2 rounded-b-[14px]">
              <div className="font-mono text-[13px] font-bold text-larsen-red mb-[18px]">{step.n}</div>
              <h3 className="font-serif font-semibold text-[23px] text-ink m-0 mb-2.5">{step.title}</h3>
              <p className="text-[14.5px] leading-[1.6] text-muted m-0">{step.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* WARRANTY BAND */}
      <section className="max-w-[1240px] mx-auto mt-[30px] mb-14 px-7">
        <Reveal
          className="bg-larsen-blue rounded-3xl px-12 py-14 relative overflow-hidden grid md:grid-cols-[1.4fr_1fr] gap-10 items-center"
        >
          <div className="absolute -top-[60px] -right-[30px] font-serif font-medium text-[280px] leading-[0.7] pointer-events-none text-white/5">365</div>
          <div className="relative z-[1]">
            <div className="font-mono text-xs tracking-[0.08em] text-larsen-pink uppercase mb-4">{t.warranty.k}</div>
            <h2 className="font-serif font-medium text-[clamp(30px,3.6vw,46px)] tracking-[-0.02em] text-white m-0 mb-4">{t.warranty.t}</h2>
            <p className="text-[16.5px] leading-[1.6] text-white/80 m-0 max-w-[480px]">{t.warranty.s}</p>
          </div>
          <div className="relative z-[1]">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-[26px] backdrop-blur-custom">
              <div className="inline-flex items-center gap-2 bg-larsen-red text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-full">{t.warranty.badge}</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[1240px] mx-auto px-7 pt-[30px] pb-20">
        <Reveal className="text-center py-[30px]">
          <h2 className="font-serif font-medium text-[clamp(32px,4vw,52px)] tracking-[-0.02em] text-ink m-0 mb-4">{t.cend.t}</h2>
          <p className="text-[18px] text-muted m-0 mx-auto mb-[30px] max-w-[540px]">{t.cend.s}</p>
          <button
            onClick={() => navigate('/cotizacion')}
            className="bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-base px-[38px] py-[17px] rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 10px 26px rgba(216,30,42,0.28)' }}
          >
            {t.cend.b}
          </button>
        </Reveal>
      </section>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} />
    </>
  );
};

export default HomePage;
