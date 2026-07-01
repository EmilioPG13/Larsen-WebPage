import { useEffect, useState, type FormEvent } from 'react';
import Reveal from '../components/ui/Reveal';
import { useT } from '../i18n/useT';
import { getMachines, submitLead } from '../services/api';
import { Check, Clock, MessageCircle, Phone } from '../components/ui/icons';
import { FileText, BarChart, DollarSign, Package } from '../components/ui/icons';

interface QuoteForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  machine: string;
  message: string;
}

const EMPTY: QuoteForm = { name: '', company: '', email: '', phone: '', machine: '', message: '' };

const inputClass =
  'font-sans text-[14.5px] px-3.5 py-3 border-[1.5px] border-line-strong rounded-[10px] bg-field text-ink outline-none transition-colors duration-200 focus:border-deep';
const labelClass = 'text-[12.5px] font-semibold text-text2';

const QuotePage = () => {
  const t = useT();
  const [form, setForm] = useState<QuoteForm>(EMPTY);
  const [machineOptions, setMachineOptions] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

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

  const upd = (k: keyof QuoteForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const machineLine = form.machine ? `${t.qpage.machine}: ${form.machine}\n` : '';
      await submitLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        budget: 'No especificado',
        purchaseDate: 'No especificado',
        message: `${machineLine}${form.message}`.trim() || undefined,
      });
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error sending quote request:', err);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY);
    setSent(false);
  };

  const processSteps = [
    { n: 1, Icon: FileText, title: t.qpage.s1t, text: t.qpage.s1d },
    { n: 2, Icon: BarChart, title: t.qpage.s2t, text: t.qpage.s2d },
    { n: 3, Icon: DollarSign, title: t.qpage.s3t, text: t.qpage.s3d },
    { n: 4, Icon: Package, title: t.qpage.s4t, text: t.qpage.s4d },
  ];

  return (
    <div>
      {/* FORM + CONTACT */}
      <div className="max-w-[1240px] mx-auto px-7 pt-[74px] pb-[90px]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-[60px] items-start">
          {/* Left: contact info */}
          <Reveal>
            <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-4">{t.qpage.k}</div>
            <h1 className="font-serif font-medium text-[clamp(38px,4.6vw,58px)] tracking-[-0.025em] text-ink m-0 mb-[18px]">{t.qpage.t}</h1>
            <p className="text-[18px] leading-[1.6] text-text2 m-0 mb-6">{t.qpage.s}</p>
            <div className="flex flex-wrap gap-3 mb-[34px]">
              <span className="inline-flex items-center gap-[9px] text-[#1F8A5B] border border-[#1F8A5B]/20 text-[13.5px] font-semibold px-4 py-[9px] rounded-full" style={{ background: 'rgba(31,138,91,0.1)' }}>
                <Check size={15} />{t.qpage.pill1}
              </span>
              <span className="inline-flex items-center gap-[9px] text-deep border border-deep/20 text-[13.5px] font-semibold px-4 py-[9px] rounded-full" style={{ background: 'var(--deep-soft)' }}>
                <Clock size={15} />{t.qpage.pill2}
              </span>
            </div>
            <div className="border-t border-line pt-[26px] flex flex-col gap-[18px]">
              <div className="flex items-start gap-3.5">
                <span className="font-mono text-[11px] text-faint w-[54px] mt-0.5">TEL</span>
                <span className="flex flex-col gap-[3px]">
                  <span className="text-[14.5px] font-semibold text-ink">775 365 0376</span>
                  <span className="text-[13.5px] text-muted">0039 348 6907430</span>
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="font-mono text-[11px] text-faint w-[54px]">EMAIL</span>
                <span className="text-[15px] text-ink">info@larsenitaliana.it</span>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="font-mono text-[11px] text-faint w-[54px]">SEDE</span>
                <span className="text-[15px] text-ink">Moglia, MN · Italia</span>
              </div>
            </div>
          </Reveal>

          {/* Right: form or success */}
          <Reveal>
            {sent ? (
              <div className="bg-surface border border-line rounded-[22px] px-10 py-14 text-center" style={{ boxShadow: '0 20px 50px rgba(26,26,31,0.08)' }}>
                <div className="w-16 h-16 mx-auto mb-[22px] rounded-full flex items-center justify-center text-[30px] text-[#1F8A5B]" style={{ background: 'rgba(31,138,91,0.12)' }}>✓</div>
                <h2 className="font-serif font-semibold text-[30px] text-ink m-0 mb-3">{t.qpage.sentT}</h2>
                <p className="text-base leading-[1.6] text-muted m-0 mb-7 max-w-[360px] mx-auto">{t.qpage.sentS}</p>
                <button onClick={resetForm} className="bg-transparent border-[1.5px] border-line-strong text-ink font-semibold text-sm px-6 py-3 rounded-full transition-colors duration-200 hover:border-deep hover:bg-deep/5">
                  {t.qpage.again}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-[22px] p-[34px] grid grid-cols-1 sm:grid-cols-2 gap-[18px]" style={{ boxShadow: '0 20px 50px rgba(26,26,31,0.08)' }}>
                <div className="flex flex-col gap-[7px]">
                  <label className={labelClass}>{t.qpage.name}</label>
                  <input required value={form.name} onChange={upd('name')} className={inputClass} />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className={labelClass}>{t.qpage.company}</label>
                  <input value={form.company} onChange={upd('company')} className={inputClass} />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className={labelClass}>{t.qpage.email}</label>
                  <input required type="email" value={form.email} onChange={upd('email')} className={inputClass} />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className={labelClass}>{t.qpage.phone}</label>
                  <input required value={form.phone} onChange={upd('phone')} className={inputClass} />
                </div>
                <div className="flex flex-col gap-[7px] sm:col-span-2">
                  <label className={labelClass}>{t.qpage.machine}</label>
                  <select value={form.machine} onChange={upd('machine')} className={inputClass}>
                    <option value="">{t.qpage.choose}</option>
                    {machineOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="other">{t.qpage.other}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[7px] sm:col-span-2">
                  <label className={labelClass}>{t.qpage.message}</label>
                  <textarea rows={4} value={form.message} onChange={upd('message')} className={`${inputClass} resize-y`} />
                </div>
                {error && (
                  <div className="sm:col-span-2 text-[13.5px] text-larsen-red">{t.qpage.errorMsg}</div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="sm:col-span-2 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15.5px] py-[15px] rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{ boxShadow: '0 8px 22px rgba(216,30,42,0.24)' }}
                >
                  {submitting ? t.qpage.sending : t.qpage.submit}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>

      {/* PROCESS */}
      <div className="max-w-[1240px] mx-auto px-7 pt-[18px] pb-[72px]">
        <Reveal className="text-center mb-[58px]">
          <div className="font-mono text-xs tracking-[0.08em] text-larsen-red uppercase mb-3.5">{t.qpage.procK}</div>
          <h2 className="font-serif font-medium text-[clamp(30px,3.6vw,44px)] tracking-[-0.02em] text-ink m-0 mb-2.5">
            {t.qpage.procT1} <span className="italic text-larsen-red">{t.qpage.procT2}</span>
          </h2>
          <p className="text-base text-muted m-0 mx-auto max-w-[560px]">{t.qpage.procS}</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {processSteps.map(({ n, Icon, title, text }) => (
            <Reveal
              key={n}
              className="relative bg-surface border border-line rounded-[18px] px-[26px] pt-9 pb-7 transition-all duration-300 hover:-translate-y-[5px] hover:border-deep/25"
            >
              <div
                className="absolute -top-4 left-6 w-[34px] h-[34px] rounded-full text-white flex items-center justify-center font-mono text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#28327B,#D81E2A)', boxShadow: '0 8px 18px rgba(40,50,123,0.3)' }}
              >
                {n}
              </div>
              <div className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center text-larsen-red my-[6px] mb-5" style={{ background: 'rgba(216,30,42,0.08)' }}>
                <Icon size={26} />
              </div>
              <h3 className="font-serif font-semibold text-[22px] text-ink m-0 mb-[9px]">{title}</h3>
              <p className="text-sm leading-[1.58] text-muted m-0">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* DIRECT CONTACT (dark) */}
      <div className="bg-[#1a1a1f]">
        <div className="max-w-[1240px] mx-auto px-7 pt-[74px] pb-20">
          <Reveal className="text-center mb-[46px]">
            <h2 className="font-serif font-medium text-[clamp(30px,3.8vw,46px)] tracking-[-0.02em] text-white m-0 mb-3">
              {t.qpage.directT1} <span className="italic text-larsen-red">{t.qpage.directT2}</span>
            </h2>
            <p className="text-[16.5px] text-white/60 m-0">{t.qpage.directS}</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
            {/* WhatsApp */}
            <div className="bg-surface border border-line rounded-[18px] px-7 py-[38px] text-center flex flex-col items-center transition-transform duration-300 hover:-translate-y-[5px]">
              <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[#1F8A5B] mb-5" style={{ background: 'rgba(31,138,91,0.12)' }}>
                <MessageCircle size={28} />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-ink m-0 mb-2">{t.qpage.waT}</h3>
              <p className="text-[14.5px] text-muted m-0 mb-[18px]">{t.qpage.waS}</p>
              <a href="https://wa.me/393486907430" target="_blank" rel="noopener noreferrer" className="mt-auto text-[15px] font-semibold text-[#1F8A5B] transition-opacity duration-200 hover:opacity-70">
                {t.qpage.waLink}
              </a>
            </div>
            {/* Phone */}
            <div className="bg-surface border border-line rounded-[18px] px-7 py-[38px] text-center flex flex-col items-center transition-transform duration-300 hover:-translate-y-[5px]">
              <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-deep mb-5" style={{ background: 'var(--deep-soft)' }}>
                <Phone size={28} />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-ink m-0 mb-2">{t.qpage.telT}</h3>
              <p className="text-[14.5px] text-muted m-0 mb-[18px]">{t.qpage.telS}</p>
              <div className="mt-auto flex flex-col items-center gap-1.5">
                <a href="tel:+17753650376" className="text-base font-bold text-deep transition-opacity duration-200 hover:opacity-70">{t.qpage.telNum}</a>
                <a href="tel:+393486907430" className="text-sm font-medium text-muted transition-opacity duration-200 hover:opacity-70">0039 348 6907430</a>
              </div>
            </div>
            {/* Hours */}
            <div className="bg-surface border border-line rounded-[18px] px-7 py-[38px] text-center flex flex-col items-center transition-transform duration-300 hover:-translate-y-[5px]">
              <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-larsen-red mb-5" style={{ background: 'rgba(216,30,42,0.08)' }}>
                <Clock size={28} />
              </div>
              <h3 className="font-serif font-semibold text-2xl text-ink m-0 mb-3.5">{t.qpage.hrsT}</h3>
              <div className="text-sm text-text2 leading-[1.55]">
                <div className="font-bold text-ink">{t.qpage.hrsRow1}</div>
                <div className="text-muted mb-2">{t.qpage.hrsRow1v}</div>
                <div className="font-bold text-ink">{t.qpage.hrsRow2}</div>
                <div className="text-muted">{t.qpage.hrsRow2v}</div>
                <div className="font-mono text-[11.5px] text-faint mt-3">{t.qpage.hrsZone}</div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-white/55 mt-[42px]">
            <span className="text-larsen-red font-semibold">Tip · </span>{t.qpage.tip}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotePage;
