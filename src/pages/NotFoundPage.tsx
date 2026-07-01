import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';

const NotFoundPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.notFound.title, t.meta.notFound.desc);

  return (
    <section className="relative max-w-[1240px] mx-auto px-7 min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-medium leading-[0.8] pointer-events-none select-none z-0 text-[clamp(160px,30vw,420px)]"
        style={{ color: 'var(--ghost)' }}
      >
        404
      </div>
      <div className="relative z-[1] max-w-[560px]">
        <div className="inline-flex items-center gap-[9px] font-mono text-xs tracking-[0.04em] text-larsen-red uppercase mb-6">
          <span className="w-[26px] h-px bg-larsen-red inline-block" />{t.notFound.tag}
        </div>
        <h1 className="font-serif font-medium text-[clamp(40px,6vw,72px)] leading-none tracking-[-0.025em] text-ink m-0 mb-5">{t.notFound.t}</h1>
        <p className="text-[18px] leading-[1.6] text-text2 m-0 mb-9 mx-auto max-w-[460px]">{t.notFound.s}</p>
        <div className="flex flex-wrap gap-3.5 justify-center">
          <Link
            to="/"
            onClick={() => window.scrollTo(0, 0)}
            className="bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15px] px-7 py-[15px] rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 8px 22px rgba(216,30,42,0.24)' }}
          >
            {t.notFound.home}
          </Link>
          <Link
            to="/maquinas"
            onClick={() => window.scrollTo(0, 0)}
            className="bg-transparent text-ink font-semibold text-[15px] px-7 py-[15px] rounded-full border-[1.5px] border-line-strong transition-colors duration-200 hover:border-larsen-red hover:bg-larsen-red/5"
          >
            {t.notFound.machines}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
