import { useNavigate } from 'react-router-dom';
import Reveal from '../components/ui/Reveal';
import CountUp from '../components/ui/CountUp';
import { ImageIcon } from '../components/ui/icons';
import { useT } from '../i18n/useT';

const AboutPage = () => {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div>
      {/* HERO */}
      <section className="relative max-w-[1240px] mx-auto px-7 pt-[78px] pb-10 text-center">
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 font-serif font-medium italic leading-[0.8] pointer-events-none select-none z-0 text-[clamp(140px,22vw,320px)]"
          style={{ color: 'var(--ghost)' }}
        >
          1964
        </div>
        <div className="relative z-[1] max-w-[760px] mx-auto">
          <div className="inline-flex items-center gap-[9px] font-mono text-xs tracking-[0.04em] text-larsen-red uppercase mb-6">
            <span className="w-[26px] h-px bg-larsen-red inline-block" />{t.apage.k}
          </div>
          <h1 className="font-serif font-medium text-[clamp(44px,6vw,80px)] leading-none tracking-[-0.025em] text-ink m-0 mb-6">{t.apage.t}</h1>
          <p className="text-[19px] leading-[1.65] text-text2 m-0">{t.apage.s}</p>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="max-w-[1000px] mx-auto px-7 py-[50px]">
        <Reveal className="text-center mb-[46px]">
          <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-3.5">{t.apage.tlk}</div>
          <h2 className="font-serif font-medium text-[clamp(28px,3.4vw,42px)] tracking-[-0.02em] text-ink m-0">{t.apage.tlt}</h2>
        </Reveal>
        <div className="relative flex flex-col gap-[18px] pl-11">
          <div className="absolute left-3.5 top-5 bottom-5 w-0.5 rounded" style={{ background: 'linear-gradient(180deg, var(--deep), rgba(216,30,42,0.55))' }} />
          {t.timeline.map((item, i) => (
            <Reveal
              key={i}
              className="relative grid grid-cols-[130px_1fr] sm:grid-cols-[170px_1fr] gap-6 sm:gap-[30px] items-start bg-surface border border-line rounded-[18px] px-8 py-[30px] transition-transform duration-300 hover:translate-x-1"
            >
              <div className="absolute -left-[37px] top-9 w-[15px] h-[15px] rounded-full bg-deep" style={{ boxShadow: '0 0 0 4px var(--bg), 0 0 0 5px var(--deep-line)' }} />
              <div className="font-serif font-semibold italic text-[30px] text-deep leading-[1.1] border-r-2 pr-6" style={{ borderColor: 'rgba(216,30,42,0.5)' }}>{item.year}</div>
              <div>
                <h3 className="font-serif font-semibold text-2xl text-ink m-0 mb-2">{item.title}</h3>
                <p className="text-[15px] leading-[1.6] text-muted m-0">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROCESS 6 */}
      <section className="max-w-[1240px] mx-auto px-7 py-14">
        <Reveal className="text-center mb-[46px]">
          <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-3.5">{t.apage.pk}</div>
          <h2 className="font-serif font-medium text-[clamp(30px,3.6vw,44px)] tracking-[-0.02em] text-ink m-0 mb-2.5">{t.apage.pt}</h2>
          <p className="text-base text-muted m-0 mx-auto max-w-[560px]">{t.apage.ps}</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.process.map((item, i) => (
            <Reveal key={i} className="bg-surface border border-line border-t-[3px] border-t-deep rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-[5px]">
              <h3 className="font-serif font-semibold text-[21px] text-ink m-0 mb-[9px]">{item.title}</h3>
              <p className="text-sm leading-[1.58] text-muted m-0">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FACILITIES */}
      <section className="max-w-[1240px] mx-auto px-7 py-14">
        <div className="grid lg:grid-cols-2 gap-[50px] items-center">
          <Reveal className="rounded-[22px] overflow-hidden border border-line" style={{ background: 'var(--plate)', boxShadow: '0 24px 50px rgba(20,22,28,0.18)' }}>
            <div className="aspect-[600/440] flex flex-col items-center justify-center gap-[18px] p-8 text-center">
              <div className="w-[68px] h-[68px] rounded-full bg-surface border border-line flex items-center justify-center text-deep" style={{ boxShadow: '0 10px 24px rgba(20,22,28,0.12)' }}>
                <ImageIcon size={30} />
              </div>
              <div>
                <div className="font-mono text-[11.5px] tracking-[0.07em] text-faint uppercase mb-[9px]">{t.apage.photoLabel}</div>
                <div className="font-serif italic text-[23px] text-text2">{t.apage.facilityCaption}</div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="font-mono text-xs tracking-[0.08em] text-deep uppercase mb-3.5">{t.apage.fk}</div>
            <h2 className="font-serif font-medium text-[clamp(28px,3.4vw,42px)] tracking-[-0.02em] text-ink m-0 mb-4">{t.apage.ft}</h2>
            <p className="text-base leading-[1.62] text-text2 m-0 mb-[26px]">{t.apage.fs}</p>
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              {t.facts.map((f, i) => (
                <div key={i} className="border border-deep/15 rounded-[14px] p-5" style={{ background: 'var(--deep-soft)' }}>
                  <div className="font-serif font-semibold text-[38px] text-deep leading-none">
                    <CountUp to={f.to} suffix={f.suffix} />
                  </div>
                  <div className="text-[13.5px] text-muted mt-[7px]">{f.label}</div>
                </div>
              ))}
              {t.factsChecks.map((c, i) => (
                <div key={i} className="border border-[#1F8A5B]/20 rounded-[14px] p-5 flex items-center gap-3" style={{ background: 'rgba(31,138,91,0.07)' }}>
                  <span className="text-[22px] text-[#1F8A5B]">✓</span>
                  <div className="text-[13.5px] font-semibold text-ink">{c}</div>
                </div>
              ))}
            </div>
            <p className="text-[15px] italic text-text2 border-l-[3px] border-larsen-red pl-[18px] m-0 leading-[1.6]">{t.apage.fq}</p>
          </Reveal>
        </div>
      </section>

      {/* SPECIALTIES (dark) */}
      <section className="bg-[#1a1a1f] mt-[30px]">
        <div className="max-w-[1240px] mx-auto px-7 py-[72px]">
          <Reveal className="text-center mb-11">
            <div className="font-mono text-xs tracking-[0.08em] text-larsen-pink uppercase mb-3.5">{t.apage.sk}</div>
            <h2 className="font-serif font-medium text-[clamp(30px,3.6vw,44px)] tracking-[-0.02em] text-white m-0 mb-2.5">{t.apage.st}</h2>
            <p className="text-base text-white/60 m-0">{t.apage.ss}</p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-3">
            {t.specialties.map((s, i) => (
              <span
                key={i}
                data-reveal=""
                className="font-serif italic text-xl text-white bg-white/[0.06] border border-white/15 px-6 py-3 rounded-full transition-colors duration-300 hover:bg-larsen-red/20 hover:border-larsen-red/50"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1240px] mx-auto px-7 pt-[70px] pb-20 text-center">
        <Reveal>
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
    </div>
  );
};

export default AboutPage;
