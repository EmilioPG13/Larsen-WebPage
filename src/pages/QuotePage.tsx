import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDocumentMeta } from '../i18n/useDocumentMeta';
import { getMachines } from '../services/api';
import { sendQuoteLead } from '../services/leads';
import { track } from '../services/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface QuoteForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  machine: string;
  mtype: string;
  volume: string;
  message: string;
  website: string; // honeypot — must stay empty
}
const EMPTY: QuoteForm = {
  name: '', company: '', email: '', phone: '', machine: '', mtype: '', volume: '', message: '', website: '',
};

type FieldKey = 'name' | 'email' | 'phone';
type FieldErrors = Partial<Record<FieldKey, string>>;

const QuotePage = () => {
  const t = useT();
  useDocumentMeta(t.meta.quote.title, t.meta.quote.desc);
  const [params] = useSearchParams();
  const preMachine = params.get('machine') ?? '';

  const [machineOptions, setMachineOptions] = useState<string[]>([]);
  const [form, setForm] = useState<QuoteForm>({ ...EMPTY, machine: preMachine });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const machines = await getMachines();
        setMachineOptions(machines.map((m) => m.name));
      } catch (err) {
        console.error('Error fetching machines for quote form:', err);
      }
    })();
  }, []);

  const machineChoices = useMemo(() => {
    if (preMachine && !machineOptions.includes(preMachine)) return [preMachine, ...machineOptions];
    return machineOptions;
  }, [machineOptions, preMachine]);

  const set =
    (k: keyof QuoteForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.website) { setReference('—'); return; } // honeypot

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
      const lines = [
        form.machine && `${t.qpage.machine}: ${form.machine}`,
        form.mtype && `${t.qpage.mtypeLabel}: ${form.mtype}`,
        form.volume && `${t.qpage.volumeLabel}: ${form.volume}`,
        form.message,
      ].filter(Boolean);
      await sendQuoteLead({
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        machine: form.machine,
        message: lines.join('\n'),
        source: 'quote-page',
      });
      track('submit_quote', { machine: form.machine || 'none', source: 'quote' });
      setReference(`LZ-${Date.now().toString(36).toUpperCase()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error sending quote request:', err);
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ ...EMPTY, machine: preMachine });
    setErrors({});
    setSubmitError(false);
    setReference(null);
  };

  const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';
  const labelCls = `${kicker} text-muted mb-1.5 block`;
  const fieldBase =
    'w-full px-3 bg-surface border border-line text-[14px] text-ink outline-none transition-colors focus:border-deep';
  const field = `${fieldBase} h-11`;
  const errCls = 'block text-[12px] text-larsen-red mt-1';
  const invalid = (k: FieldKey) => (errors[k] ? ' border-larsen-red focus:border-larsen-red' : '');

  return (
    <div className="max-w-[720px] mx-auto px-7 pt-14 md:pt-[72px] pb-14 md:pb-[88px]">
      <header className="mb-10">
        <div className={`${kicker} text-deep mb-4`}>{t.qpage.k}</div>
        <h1 className="font-serif font-medium text-[clamp(34px,4.4vw,52px)] tracking-[-0.01em] text-ink m-0 mb-4">
          {t.qpage.t}
        </h1>
        <p className="text-[15px] leading-[1.6] text-text2 m-0">{t.qpage.s}</p>
      </header>

      {reference ? (
        <div className="border border-line bg-surface px-8 py-12 text-center">
          <div className={`${kicker} text-deep mb-4`}>{t.qpage.sentT}</div>
          <h2 className="font-serif font-medium text-[clamp(24px,3vw,32px)] leading-snug text-ink m-0 mb-4 max-w-[34ch] mx-auto">
            {t.qpage.sentS}
          </h2>
          {reference !== '—' && (
            <p className="font-mono text-[12px] tracking-[0.14em] text-muted m-0">REF · {reference}</p>
          )}
          <button
            onClick={resetForm}
            className={`${kicker} mt-8 h-11 px-5 border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep`}
          >
            {t.qpage.again}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="border border-line bg-surface p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          <div>
            <label className={labelCls}>{t.qpage.name}</label>
            <input aria-label={t.qpage.name} value={form.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!errors.name} className={field + invalid('name')} />
            {errors.name && <span className={errCls}>{errors.name}</span>}
          </div>
          <div>
            <label className={labelCls}>{t.qpage.company}</label>
            <input aria-label={t.qpage.company} value={form.company} onChange={set('company')} className={field} />
          </div>
          <div>
            <label className={labelCls}>{t.qpage.email}</label>
            <input type="email" aria-label={t.qpage.email} value={form.email} onChange={set('email')} onBlur={blur('email')} aria-invalid={!!errors.email} className={field + invalid('email')} />
            {errors.email && <span className={errCls}>{errors.email}</span>}
          </div>
          <div>
            <label className={labelCls}>{t.qpage.phone}</label>
            <input aria-label={t.qpage.phone} value={form.phone} onChange={set('phone')} onBlur={blur('phone')} aria-invalid={!!errors.phone} className={field + invalid('phone')} />
            {errors.phone && <span className={errCls}>{errors.phone}</span>}
          </div>

          <div>
            <label className={labelCls}>{t.qpage.mtypeLabel}</label>
            <select aria-label={t.qpage.mtypeLabel} value={form.mtype} onChange={set('mtype')} className={field}>
              <option value="">{t.qpage.pick}</option>
              {t.qpage.mtypeOpts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.qpage.volumeLabel}</label>
            <select aria-label={t.qpage.volumeLabel} value={form.volume} onChange={set('volume')} className={field}>
              <option value="">{t.qpage.pick}</option>
              {t.qpage.volumeOpts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>{t.qpage.machine}</label>
            <select aria-label={t.qpage.machine} value={form.machine} onChange={set('machine')} className={field}>
              <option value="">{t.qpage.choose}</option>
              {machineChoices.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              <option value="other">{t.qpage.other}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>{t.qpage.message}</label>
            <textarea aria-label={t.qpage.message} rows={4} value={form.message} onChange={set('message')} className={`${fieldBase} min-h-[112px] py-2.5 resize-y`} />
          </div>

          {/* honeypot */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.website} onChange={set('website')} />

          {submitError && <p className="sm:col-span-2 text-[13px] text-larsen-red m-0">{t.qpage.errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] h-12 transition-colors disabled:opacity-60"
          >
            {submitting ? t.qpage.sending : t.qpage.submit}
          </button>
        </form>
      )}

      {!reference && (
        <p className="text-[13px] text-muted mt-6">{t.qpage.talkTo}</p>
      )}
    </div>
  );
};

export default QuotePage;
