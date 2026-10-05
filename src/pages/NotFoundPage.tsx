import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';

const NotFoundPage = () => {
  const t = useT();
  useDocumentMeta(t.meta.notFound.title, t.meta.notFound.desc);

  return (
    <section className="max-w-[1280px] mx-auto px-7 py-20 md:py-32 flex justify-center">
      <div className="border border-line bg-surface p-10 md:p-14 w-full max-w-[620px]">
        <div className="display text-[clamp(72px,13vw,128px)] leading-none text-larsen-red" aria-hidden="true">
          404
        </div>
        <p className="text-[14px] font-semibold text-muted m-0 mt-2">{t.notFound.tag}</p>
        <h1 className="display text-[clamp(28px,4vw,42px)] text-ink m-0 mt-5 mb-4">
          {t.notFound.t}
        </h1>
        <p className="text-[15px] leading-[1.6] text-muted max-w-[42ch] m-0 mb-8">{t.notFound.s}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 px-7 transition-colors"
          >
            {t.notFound.home}
          </Link>
          <Link
            to="/maquinas"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center h-12 px-5 border border-line-strong text-ink text-[14px] font-semibold transition-colors hover:border-deep hover:text-deep"
          >
            {t.notFound.machines}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
