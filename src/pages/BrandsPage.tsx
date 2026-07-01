import Reveal from '../components/ui/Reveal';
import { useT } from '../i18n/useT';
import { useLanguage } from '../i18n/LanguageContext';
import { brands } from '../data/brands';

const BrandsPage = () => {
  const t = useT();
  const { lang } = useLanguage();

  return (
    <div className="max-w-[1240px] mx-auto px-7 pt-[74px] pb-20">
      <Reveal className="max-w-[640px] mb-[52px]">
        <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-4">{t.bpage.k}</div>
        <h1 className="font-serif font-medium text-[clamp(40px,5vw,64px)] tracking-[-0.025em] text-ink m-0 mb-4">{t.bpage.t}</h1>
        <p className="text-[18px] leading-[1.6] text-text2 m-0">{t.bpage.s}</p>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-[22px]">
        {brands.map((b) => (
          <Reveal
            key={b.name}
            className="bg-surface border border-line rounded-[18px] p-8 flex gap-[26px] items-center transition-all duration-300 hover:-translate-y-1 hover:border-deep/25"
          >
            <div
              className="shrink-0 w-[148px] h-[104px] border border-line rounded-[14px] flex items-center justify-center p-[22px] overflow-hidden"
              style={{ background: 'var(--logo-bg)' }}
            >
              <img src={b.image} alt={b.name} className="lz-logo-lg max-w-full max-h-[72px] object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2.5 mb-2">
                <h2 className="font-serif font-semibold text-2xl text-ink m-0">{b.name}</h2>
                <span className="font-mono text-[11px] tracking-[0.05em] text-larsen-red uppercase">{b.origin[lang]}</span>
              </div>
              <p className="text-[14.5px] leading-[1.58] text-muted m-0">{b.blurb[lang]}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default BrandsPage;
