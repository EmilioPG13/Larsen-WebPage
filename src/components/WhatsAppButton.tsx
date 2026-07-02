import { useT } from '../i18n/useT';
import { track } from '../services/analytics';
import { Whatsapp } from './ui/icons';

const WHATSAPP_NUMBER = '527753650376';

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
      className="fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-transform duration-200 hover:scale-110"
      style={{ boxShadow: '0 8px 22px rgba(37,211,102,0.45)' }}
    >
      <Whatsapp size={30} />
    </a>
  );
};

export default WhatsAppButton;
