import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';

const PLATE = 'max-w-[1280px] mx-auto px-7';
const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';

const AboutPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.about.title, t.meta.about.desc);
  const navigate = useNavigate();

  return (
    <>
      {/* ================= STORY + FACILITY IMAGE ================= */}
      <section className="border-b border-line bg-surface">
        <div className={`${PLATE} grid lg:grid-cols-[1.05fr_0.95fr]`}>
          <div className="py-12 md:py-16 lg:pr-12">
            <div className={`${kicker} text-deep mb-4`}>{t.apage.k}</div>
            <h1 className="font-serif font-medium text-[clamp(38px,5.2vw,60px)] leading-[1.03] tracking-[-0.01em] text-ink m-0 mb-5">
              {t.apage.t}
            </h1>
            <p className="text-[15px] leading-[1.65] text-text2 max-w-[52ch] m-0">{t.apage.s}</p>
            <div className="flex gap-10 mt-9">
              {t.facts.map((f) => (
                <div key={f.label}>
                  <div className="font-mono font-bold text-[28px] text-deep leading-none">
                    {f.to}
                    {f.suffix}
                  </div>
                  <div className="text-[13px] text-muted mt-1.5 max-w-[16ch]">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative bg-surface-2 border-t border-line-soft lg:border-t-0 lg:border-l lg:border-line-soft flex items-center justify-center p-8 md:p-10">
            <img
              src="/images/machines/VESTAMULTI.png"
              alt="Steiger Vesta Multi"
              decoding="async"
              className="w-full max-w-[420px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* ================= TIMELINE ================= */}
      <section className={`${PLATE} py-14 md:py-[72px]`}>
        <div className={`${kicker} text-deep mb-6`}>{t.apage.tlk}</div>
        <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
          {t.timeline.map((tl) => (
            <div key={tl.year} className="bg-bg p-6">
              <div className="font-mono text-[13px] font-bold text-larsen-red">{tl.year}</div>
              <h3 className="font-serif font-medium text-[20px] text-ink m-0 mt-3 mb-2">{tl.title}</h3>
              <p className="text-[13.5px] leading-[1.6] text-muted m-0">{tl.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PROCESS ================= */}
      <section className={`${PLATE} pb-14 md:pb-[88px]`}>
        <div className={`${kicker} text-deep mb-4`}>{t.apage.pk}</div>
        <h2 className="font-serif font-medium text-[clamp(28px,3.4vw,40px)] leading-[1.06] tracking-[-0.01em] text-ink m-0 mb-8">
          {t.apage.pt}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
          {t.process.map((p, i) => (
            <div key={p.title} className="bg-surface p-6">
              <div className={`${kicker} text-deep`}>{String(i + 1).padStart(2, '0')}</div>
              <h3 className="font-serif font-medium text-[19px] text-ink m-0 mt-2.5 mb-2">{p.title}</h3>
              <p className="text-[13px] leading-[1.6] text-muted m-0">{p.text}</p>
            </div>
          ))}
        </div>
        <blockquote className="mt-10 border-l-2 border-larsen-red pl-6 font-serif italic text-[clamp(18px,2.4vw,22px)] leading-[1.45] text-deep max-w-[760px] m-0">
          {t.apage.fq}
        </blockquote>
      </section>

      {/* ================= CONTACT ================= */}
      <section className={`${PLATE} pb-16 md:pb-[100px]`}>
        <div className={`${kicker} text-deep mb-4`}>{t.apage.contactK}</div>
        <h2 className="font-serif font-medium text-[clamp(26px,3vw,36px)] tracking-[-0.01em] text-ink m-0 mb-8">
          {t.apage.contactT}
        </h2>
        <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
          <div className="bg-surface p-6">
            <div className={`${kicker} text-muted mb-3`}>{t.qpage.phone}</div>
            <a
              href="tel:+527753650376"
              className="block font-mono text-[15px] text-ink transition-colors hover:text-deep"
            >
              +52 775 365 0376
            </a>
            <a
              href="tel:+393486907430"
              className="block font-mono text-[13px] text-muted transition-colors hover:text-deep mt-1"
            >
              +39 348 6907430
            </a>
          </div>
          <div className="bg-surface p-6">
            <div className={`${kicker} text-muted mb-3`}>{t.qpage.email}</div>
            <a
              href="mailto:admin@larsenitaliana.com"
              className="font-mono text-[14px] text-ink transition-colors hover:text-deep break-all"
            >
              admin@larsenitaliana.com
            </a>
          </div>
          <div className="bg-surface p-6">
            <div className={`${kicker} text-muted mb-3`}>
              {t.contact.office} · {t.contact.workshop}
            </div>
            <p className="text-[13.5px] leading-[1.55] text-text2 m-0">{t.contact.mexico}</p>
            <p className="text-[13.5px] leading-[1.55] text-muted m-0 mt-1">{t.contact.italy}</p>
          </div>
        </div>
        <button
          onClick={() => {
            window.scrollTo(0, 0);
            navigate('/cotizacion');
          }}
          className="mt-8 inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 px-7 transition-colors"
        >
          {t.cend.b}
        </button>
      </section>
    </>
  );
};

export default AboutPage;
