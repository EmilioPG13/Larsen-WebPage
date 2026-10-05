import { useT } from '../i18n/useT';
import { track } from '../services/analytics';
import { Whatsapp } from './ui/icons';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';

/** Floating WhatsApp button, shown site-wide on public pages. */
const WhatsAppButton = () => {
  const t = useT();
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsapp.prefill)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsapp.label}
      title={t.whatsapp.label}
      onClick={() => track('click_whatsapp', { source: 'floating_button' })}
      className="fixed bottom-6 right-6 z-50 w-[54px] h-[54px] rounded-full bg-larsen-blue text-white flex items-center justify-center transition-transform duration-200 hover:scale-[1.06] motion-reduce:transition-none motion-reduce:hover:scale-100"
      style={{ boxShadow: '0 8px 22px rgba(40,50,123,0.32)' }}
    >
      <Whatsapp size={28} />
    </a>
  );
};

export default WhatsAppButton;
