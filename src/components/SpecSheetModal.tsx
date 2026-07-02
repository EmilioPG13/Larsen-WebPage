import { useState, type FormEvent } from 'react';
import { useT } from '../i18n/useT';
import { useLanguage } from '../i18n/LanguageContext';
import { sendQuoteLead } from '../services/leads';
import { downloadSpecSheet } from '../services/specSheet';
import { track } from '../services/analytics';
import { X } from './ui/icons';
import type { Machine } from '../types';

interface SpecSheetModalProps {
  machine: Machine;
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'font-sans text-[14.5px] px-3.5 py-3 border-[1.5px] border-line-strong rounded-[10px] bg-field text-ink outline-none transition-colors duration-200 focus:border-deep';

const SpecSheetModal = ({ machine, isOpen, onClose }: SpecSheetModalProps) => {
  const t = useT();
  const { lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const upd = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      // Fire the lead (best-effort) — a download is a strong intent signal.
      await sendQuoteLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        machine: machine.name,
        message: `Descarga de ficha técnica: ${machine.name}`,
        source: 'spec-download',
      }).catch((err) => console.error('Lead (spec-download) failed:', err));

      await downloadSpecSheet(machine, lang);
      track('download_spec', { machine_id: machine.id, machine_name: machine.name });

      setForm({ name: '', email: '', phone: '' });
      onClose();
    } catch (err) {
      console.error('Spec sheet generation failed:', err);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-modal-backdrop-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[420px] bg-surface border border-line rounded-[20px] p-8 animate-modal-enter"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-fill transition-colors"
        >
          <X size={18} />
        </button>

        <div className="font-mono text-[11px] tracking-[0.06em] text-larsen-red uppercase mb-2">{machine.name}</div>
        <h2 className="font-serif font-semibold text-[24px] text-ink m-0 mb-2">{t.specSheet.title}</h2>
        <p className="text-[14.5px] leading-[1.5] text-muted m-0 mb-6">{t.specSheet.sub}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <input required value={form.name} onChange={upd('name')} placeholder={t.specSheet.name} className={inputClass} />
          <input required type="email" value={form.email} onChange={upd('email')} placeholder={t.specSheet.email} className={inputClass} />
          <input required value={form.phone} onChange={upd('phone')} placeholder={t.specSheet.phone} className={inputClass} />
          {error && <span className="text-[12.5px] text-larsen-red">{t.specSheet.error}</span>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[15px] py-[13px] rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ boxShadow: '0 8px 22px rgba(216,30,42,0.24)' }}
          >
            {submitting ? t.specSheet.sending : t.specSheet.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SpecSheetModal;
