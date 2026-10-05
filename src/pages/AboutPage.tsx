import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import MachineImage from '../components/ui/MachineImage';

const PLATE = 'max-w-[1280px] mx-auto px-7';

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
            <h1 className="display text-[clamp(40px,5.4vw,68px)] text-ink m-0 mb-5">
              {t.apage.t}
            </h1>
            <p className="text-[15px] leading-[1.65] text-text2 max-w-[52ch] m-0">{t.apage.s}</p>
            <div className="flex gap-10 mt-9">
              {t.facts.map((f) => (
                <div key={f.label}>
                  <div className="display text-[40px] text-deep leading-none tabular-nums">
                    {f.to}
                    {f.suffix}
                  </div>
                  <div className="text-[13px] text-muted mt-1.5 max-w-[16ch]">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative bg-surface-2 border-t border-line-soft lg:border-t-0 lg:border-l lg:border-line-soft flex items-center justify-center p-8 md:p-10">
            <MachineImage
              src="/images/machines/VESTAMULTI.png"
              alt="Steiger Vesta Multi"
              decoding="async"
              className="w-full max-w-[420px] object-contain"
              style={{ filter: 'drop-shadow(0 24px 20px rgba(19, 26, 79, 0.18))' }}
            />
          </div>
        </div>
      </section>

      {/* ================= TIMELINE ================= */}
      <section className={`${PLATE} py-14 md:py-[72px]`}>
        <h2 className="display text-[clamp(28px,3.4vw,40px)] text-ink m-0 mb-8">{t.apage.tlt}</h2>
        <div className="grid sm:grid-cols-3 gap-x-10 gap-y-8">
          {t.timeline.map((tl) => (
            <div key={tl.year} className="border-t-[3px] border-deep pt-5">
              <div className="text-[15px] font-bold text-larsen-red">{tl.year}</div>
              <h3 className="display text-[22px] text-ink m-0 mt-2 mb-2">{tl.title}</h3>
              <p className="text-[14px] leading-[1.6] text-text2 m-0">{tl.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PROCESS ================= */}
      <section className={`${PLATE} pb-14 md:pb-[88px]`}>
        <h2 className="display text-[clamp(28px,3.4vw,40px)] text-ink m-0 mb-8">{t.apage.pt}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {t.process.map((p) => (
            <div key={p.title} className="border-t border-line-strong pt-4">
              <h3 className="display text-[21px] text-ink m-0 mb-2">{p.title}</h3>
              <p className="text-[14px] leading-[1.6] text-text2 m-0">{p.text}</p>
            </div>
          ))}
        </div>
        <blockquote className="mt-12 display text-[clamp(22px,2.8vw,30px)] leading-[1.25] text-deep max-w-[760px] m-0">
          {t.apage.fq}
        </blockquote>
      </section>

      {/* ================= CONTACT ================= */}
      <section className={`${PLATE} pb-16 md:pb-[100px]`}>
        <h2 className="display text-[clamp(28px,3.4vw,40px)] text-ink m-0 mb-8">
          {t.apage.contactT}
        </h2>
        <div className="grid sm:grid-cols-3 gap-px bg-line border border-line">
          <div className="bg-surface p-6">
            <div className="text-[13px] font-semibold text-muted mb-3">{t.qpage.phone}</div>
            <a
              href="tel:+527753650376"
              className="block text-[17px] font-semibold text-ink transition-colors hover:text-deep"
            >
              +52 775 365 0376
            </a>
            <a
              href="tel:+393486907430"
              className="block text-[14px] text-muted transition-colors hover:text-deep mt-1"
            >
              +39 348 6907430
            </a>
          </div>
          <div className="bg-surface p-6">
            <div className="text-[13px] font-semibold text-muted mb-3">{t.qpage.email}</div>
            <a
              href="mailto:admin@larsenitaliana.com"
              className="text-[16px] font-semibold text-ink transition-colors hover:text-deep break-all"
            >
              admin@larsenitaliana.com
            </a>
          </div>
          <div className="bg-surface p-6">
            <div className="text-[13px] font-semibold text-muted mb-3">
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
          className="mt-8 inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15px] h-[52px] px-8 transition-colors"
        >
          {t.cend.b}
        </button>
      </section>
    </>
  );
};

export default AboutPage;
