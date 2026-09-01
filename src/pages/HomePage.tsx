import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useT } from '../i18n/useT';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeMachine } from '../i18n/localizeMachine';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { brands } from '../data/brands';
import { getMachines } from '../services/api';
import { sendQuoteLead } from '../services/leads';
import { track } from '../services/analytics';
import type { Machine } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTOPLAY_MS = 6000;
const PLATE = 'max-w-[1280px] mx-auto px-7';

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface QuoteForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  machine: string;
  message: string;
  website: string; // honeypot — must stay empty
}
const EMPTY: QuoteForm = { name: '', company: '', email: '', phone: '', machine: '', message: '', website: '' };

type FieldKey = 'name' | 'email' | 'phone';
type FieldErrors = Partial<Record<FieldKey, string>>;

const HomePage = () => {
  const t = useT();
  useDocumentMeta(t.meta.home.title, t.meta.home.desc);
  const { lang } = useLanguage();

  const [rawMachines, setRawMachines] = useState<Machine[]>([]);
  const [loadError, setLoadError] = useState(false);
  const machines = useMemo(
    () => rawMachines.map((m) => localizeMachine(m, lang)),
    [rawMachines, lang],
  );

  useEffect(() => {
    (async () => {
      try {
        setRawMachines(await getMachines());
      } catch (err) {
        console.error('Error fetching machines:', err);
        setLoadError(true);
      }
    })();
  }, []);

  // ---- carousel ----------------------------------------------------------
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = machines.length;

  useEffect(() => {
    if (active >= count && count > 0) setActive(0);
  }, [count, active]);

  useEffect(() => {
    if (paused || count < 2 || reducedMotion()) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const current: Machine | undefined = machines[active];

  // ---- inline quote form ----------------------------------------------------
  const [form, setForm] = useState<QuoteForm>(EMPTY);
  const machineTouched = useRef(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // keep "machine of interest" synced to the active slide until the user picks one
  useEffect(() => {
    if (!machineTouched.current && current) {
      setForm((f) => ({ ...f, machine: current.name }));
    }
  }, [current]);

  // bring the confirmation plate into view once a request resolves
  useEffect(() => {
    if (reference) {
      formRef.current?.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [reference]);

  const set =
    (k: keyof QuoteForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (k === 'machine') machineTouched.current = true;
      setForm((f) => ({ ...f, [k]: e.target.value }));
      if (k === 'name' || k === 'email' || k === 'phone') {
        setErrors((prev) => ({ ...prev, [k]: undefined }));
      }
    };

  const fieldError = (k: FieldKey, value: string): string | undefined => {
    if (!value.trim()) return t.qpage.req;
    if (k === 'email' && !EMAIL_RE.test(value.trim())) return t.qpage.invalidEmail;
    return undefined;
  };

  const blur = (k: FieldKey) => () =>
    setErrors((prev) => ({ ...prev, [k]: fieldError(k, form[k]) }));

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({
      behavior: reducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.website) { setReference('—'); return; } // honeypot: pretend success

    const next: FieldErrors = {
      name: fieldError('name', form.name),
      email: fieldError('email', form.email),
      phone: fieldError('phone', form.phone),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    setSubmitError(false);
    try {
      const machineLine = form.machine ? `${t.qpage.machine}: ${form.machine}\n` : '';
      await sendQuoteLead({
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        machine: form.machine,
        message: `${machineLine}${form.message}`.trim(),
        source: 'home-quote',
      });
      track('submit_quote', { machine: form.machine || 'none', source: 'home' });
      setReference(`LZ-${Date.now().toString(36).toUpperCase()}`);
    } catch (err) {
      console.error('Error sending quote request:', err);
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY);
    machineTouched.current = false;
    setErrors({});
    setSubmitError(false);
    setReference(null);
  };

  // ---- shared class fragments ---------------------------------------------
  const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';
  const fieldBase =
    'w-full px-3 bg-surface border border-line text-[14px] text-ink outline-none transition-colors focus:border-deep';
  const field = `${fieldBase} h-11`;
  const labelCls = `${kicker} text-muted mb-1.5 block`;
  const errCls = 'block text-[12px] text-larsen-red mt-1';

  return (
    <>
      {/* ================= HERO PLATE: carousel + inline quote form ================= */}
      <section className="border-b border-line bg-surface">
        <div
          className={`${PLATE} pt-12 md:pt-[72px] pb-14 md:pb-[88px]`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* model tabs */}
          {count > 0 && (
            <div
              role="tablist"
              aria-label={t.home.carouselHint}
              className="flex flex-wrap gap-x-7 gap-y-2 border-b border-line-soft mb-10"
            >
              {machines.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  id={`carousel-tab-${m.id}`}
                  aria-selected={i === active}
                  aria-controls="carousel-panel"
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`${kicker} pb-3 -mb-px border-b-2 transition-colors ${
                    i === active
                      ? 'text-ink border-deep'
                      : 'text-muted border-transparent hover:text-ink'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {/* stage */}
          {current ? (
            <div
              key={active}
              data-slide
              id="carousel-panel"
              role="tabpanel"
              aria-labelledby={`carousel-tab-${current.id}`}
              tabIndex={0}
              className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-14 items-center"
            >
              <div>
                <div className={`${kicker} text-deep mb-5`}>
                  {current.brand} · {t.home.kicker}
                </div>
                <h1 className="font-serif font-medium text-[clamp(38px,5.2vw,68px)] leading-[1.02] tracking-[-0.01em] text-ink m-0 mb-5">
                  {current.name}
                </h1>
                <p className="text-[15px] leading-[1.6] text-text2 max-w-[46ch] m-0 mb-8">
                  {current.description}
                </p>
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex items-center bg-deep text-white font-semibold text-[14px] px-6 h-12 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {t.detail.ctaQuote}
                </button>
              </div>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-[6%] pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 50% 45%, var(--deep-soft), transparent 70%)' }}
                />
                <img
                  src={current.image}
                  alt={`${current.brand} ${current.name}`}
                  decoding="async"
                  fetchPriority="high"
                  className="relative w-full max-w-[560px] mx-auto block object-contain"
                />
              </div>
            </div>
          ) : loadError ? (
            <p className="text-[14px] text-larsen-red m-0">{t.mpage.error}</p>
          ) : (
            <div className="h-[320px]" aria-hidden="true" />
          )}

          {/* inline quote form — same plate */}
          <div ref={formRef} className="mt-14 md:mt-[72px] pt-12 border-t border-line scroll-mt-24">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10">
              <div>
                <div className={`${kicker} text-deep mb-4`}>{t.qpage.k}</div>
                <h2 className="font-serif font-medium text-[clamp(26px,3vw,36px)] tracking-[-0.01em] text-ink m-0 mb-3">
                  {t.home.formTitle}
                </h2>
                <p className="text-[14px] leading-[1.6] text-muted m-0">{t.home.formNote}</p>
              </div>

              {reference ? (
                <div className="border border-line bg-surface-2 px-8 py-10">
                  <div className={`${kicker} text-deep mb-3`}>{t.qpage.sentT}</div>
                  <h3 className="font-serif font-medium text-[26px] leading-snug text-ink m-0 mb-3">
                    {t.qpage.sentS}
                  </h3>
                  {reference !== '—' && (
                    <p className="font-mono text-[12px] tracking-[0.12em] text-muted m-0">REF · {reference}</p>
                  )}
                  <button
                    onClick={resetForm}
                    className="mt-6 border border-line-strong text-ink font-semibold text-[13px] px-5 h-11 transition-colors hover:border-deep"
                  >
                    {t.qpage.again}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t.qpage.name}</label>
                    <input
                      aria-label={t.qpage.name}
                      value={form.name}
                      onChange={set('name')}
                      onBlur={blur('name')}
                      aria-invalid={!!errors.name}
                      className={`${field} ${errors.name ? 'border-larsen-red focus:border-larsen-red' : ''}`}
                    />
                    {errors.name && <span className={errCls}>{errors.name}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>{t.qpage.company}</label>
                    <input aria-label={t.qpage.company} value={form.company} onChange={set('company')} className={field} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.qpage.email}</label>
                    <input
                      type="email"
                      aria-label={t.qpage.email}
                      value={form.email}
                      onChange={set('email')}
                      onBlur={blur('email')}
                      aria-invalid={!!errors.email}
                      className={`${field} ${errors.email ? 'border-larsen-red focus:border-larsen-red' : ''}`}
                    />
                    {errors.email && <span className={errCls}>{errors.email}</span>}
                  </div>
                  <div>
                    <label className={labelCls}>{t.qpage.phone}</label>
                    <input
                      aria-label={t.qpage.phone}
                      value={form.phone}
                      onChange={set('phone')}
                      onBlur={blur('phone')}
                      aria-invalid={!!errors.phone}
                      className={`${field} ${errors.phone ? 'border-larsen-red focus:border-larsen-red' : ''}`}
                    />
                    {errors.phone && <span className={errCls}>{errors.phone}</span>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{t.qpage.machine}</label>
                    <select aria-label={t.qpage.machine} value={form.machine} onChange={set('machine')} className={field}>
                      <option value="">{t.qpage.choose}</option>
                      {machines.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                      <option value="other">{t.qpage.other}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{t.qpage.message}</label>
                    <textarea
                      aria-label={t.qpage.message}
                      rows={4}
                      value={form.message}
                      onChange={set('message')}
                      className={`${fieldBase} min-h-[112px] py-2.5 resize-y`}
                    />
                  </div>
                  {/* honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                    value={form.website}
                    onChange={set('website')}
                  />
                  {submitError && (
                    <p className="sm:col-span-2 text-[13px] text-larsen-red m-0">{t.qpage.errorMsg}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:col-span-2 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 transition-colors disabled:opacity-60"
                  >
                    {submitting ? t.qpage.sending : t.qpage.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CAPABILITY STRIP ================= */}
      <section className={`${PLATE} py-14 md:py-[88px]`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {t.home.caps.map((c) => (
            <div key={c.k} className="bg-bg p-6">
              <div className={`${kicker} text-deep mb-3`}>{c.k}</div>
              <p className="text-[14px] leading-[1.55] text-text2 m-0">{c.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= BRAND MARQUEE ================= */}
      <section className="border-t border-line py-14 md:py-[72px] overflow-hidden">
        <div className={`${PLATE} mb-8`}>
          <div className={`${kicker} text-muted`}>{t.home.marquee}</div>
        </div>
        <div className="flex w-max lz-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-16 pr-16 shrink-0" aria-hidden={dup === 1}>
              {brands.map((b) => (
                <img
                  key={b.name}
                  src={b.image}
                  alt={b.name}
                  loading="lazy"
                  decoding="async"
                  className="lz-logo w-auto object-contain shrink-0"
                  style={{ maxHeight: `${48 * (b.logoScale ?? 1)}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
