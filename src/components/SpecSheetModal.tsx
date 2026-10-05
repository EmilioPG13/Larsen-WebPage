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
  'font-sans text-[14px] px-3 h-11 border border-line bg-surface text-ink outline-none transition-colors duration-200 focus:border-deep';

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
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.specSheet.title}
        className="relative w-full max-w-[420px] bg-surface border border-line p-8 animate-modal-enter"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-muted hover:text-ink hover:bg-fill transition-colors"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="text-[13px] font-semibold text-larsen-red mb-1">{machine.name}</div>
        <h2 className="display text-[24px] text-ink m-0 mb-2">{t.specSheet.title}</h2>
        <p className="text-[14px] leading-[1.5] text-muted m-0 mb-6">{t.specSheet.sub}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input required value={form.name} onChange={upd('name')} placeholder={t.specSheet.name} aria-label={t.specSheet.name} className={inputClass} />
          <input required type="email" value={form.email} onChange={upd('email')} placeholder={t.specSheet.email} aria-label={t.specSheet.email} className={inputClass} />
          <input required value={form.phone} onChange={upd('phone')} placeholder={t.specSheet.phone} aria-label={t.specSheet.phone} className={inputClass} />
          {error && <span className="text-[12.5px] text-larsen-red">{t.specSheet.error}</span>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 h-12 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] transition-colors duration-200 disabled:opacity-60"
          >
            {submitting ? t.specSheet.sending : t.specSheet.submit}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SpecSheetModal;
