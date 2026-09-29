import React, { useState, useEffect, useRef } from 'react';
import { sendQuoteLead } from '../services/leads';
import { X } from './ui/icons';
import type { Product, ContactFormData } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

const kicker = 'font-mono text-[11px] tracking-[0.14em] uppercase';
const labelCls = `${kicker} text-muted mb-1.5 block`;
const fieldCls =
  'w-full px-3 h-11 bg-surface border border-line text-[14px] text-ink outline-none transition-colors focus:border-deep';
const textareaCls =
  'w-full px-3 py-2.5 min-h-[112px] bg-surface border border-line text-[14px] text-ink outline-none transition-colors focus:border-deep resize-y';

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, product }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    productId: product?.id || '',
    productName: product?.name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  };

  // Center modal in viewport when opened + lock body scroll
  useEffect(() => {
    if (isOpen && modalRef.current) {
      setIsClosing(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const timer = setTimeout(() => {
        const modalElement = modalRef.current;
        if (modalElement) {
          const rect = modalElement.getBoundingClientRect();
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            modalElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
    document.body.style.overflow = 'unset';
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Goes through the same channel as the quote form so it lands in `leads`.
      const lines = [
        formData.productName && `Máquina de interés: ${formData.productName}`,
        formData.message,
      ].filter(Boolean);
      await sendQuoteLead({
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        machine: formData.productName || '',
        message: lines.join('\n'),
        source: 'catalog-interest',
      });

      setSubmitStatus('success');

      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          message: '',
          productId: product?.id || '',
          productName: product?.name || '',
        });
        setSubmitStatus('idle');
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ${
        isClosing ? 'animate-modal-backdrop-exit' : 'animate-modal-backdrop-enter'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Solicitar información"
        className={`relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-surface border border-line ${
          isClosing ? 'animate-modal-exit' : 'animate-modal-enter'
        }`}
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif font-medium text-[22px] text-ink m-0">Solicitar información</h2>
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="shrink-0 w-9 h-9 flex items-center justify-center text-muted transition-colors hover:text-ink hover:bg-fill"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          {product && (
            <p className="text-[13px] text-muted mt-2 m-0">
              Interesado en: <span className={`${kicker} text-deep`}>{product.name}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="cm-name" className={labelCls}>
              Nombre completo *
            </label>
            <input
              type="text"
              id="cm-name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className={fieldCls}
            />
          </div>

          <div>
            <label htmlFor="cm-email" className={labelCls}>
              Correo electrónico *
            </label>
            <input
              type="email"
              id="cm-email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={fieldCls}
            />
          </div>

          <div>
            <label htmlFor="cm-phone" className={labelCls}>
              Teléfono *
            </label>
            <input
              type="tel"
              id="cm-phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className={fieldCls}
            />
          </div>

          <div>
            <label htmlFor="cm-company" className={labelCls}>
              Empresa
            </label>
            <input
              type="text"
              id="cm-company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className={fieldCls}
            />
          </div>

          <div>
            <label htmlFor="cm-message" className={labelCls}>
              Mensaje
            </label>
            <textarea
              id="cm-message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleInputChange}
              className={textareaCls}
            />
          </div>

          {submitStatus === 'success' && (
            <p className="text-[13px] text-deep border border-deep-line bg-deep-soft px-3 py-2 m-0">
              ¡Mensaje enviado! Nos pondremos en contacto pronto.
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="text-[13px] text-larsen-red border border-larsen-red px-3 py-2 m-0">
              Error al enviar el mensaje. Por favor, inténtalo de nuevo.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className={`${kicker} flex-1 h-11 border border-line-strong text-ink transition-colors hover:border-deep hover:text-deep`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 bg-larsen-red hover:bg-larsen-dark-red text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
