import emailjs from '@emailjs/browser';
import { submitLead } from './api';

export interface QuoteLeadPayload {
  name: string;
  company?: string;
  email: string;
  phone: string;
  machine: string;
  /** Fully composed message (machine of interest + free-text). */
  message: string;
  /** Where the lead came from, e.g. 'quote-form' | 'spec-download'. */
  source?: string;
  /** Set when the quote is for one unit of the catalog. */
  inventoryUnitId?: string;
  serialNumber?: string;
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export const emailjsConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

async function sendViaEmailjs(p: QuoteLeadPayload): Promise<void> {
  if (!emailjsConfigured) throw new Error('EmailJS not configured');
  await emailjs.send(
    SERVICE_ID!,
    TEMPLATE_ID!,
    {
      to_name: 'Larsen Italiana Admin',
      to_email: 'admin@larsenitaliana.com',
      from_name: p.name,
      company: p.company || '—',
      reply_to: p.email,
      email: p.email,
      phone: p.phone,
      machine: p.machine || '—',
      serial_number: p.serialNumber || '—',
      source: p.source || 'quote-form',
      message: p.message,
    },
    { publicKey: PUBLIC_KEY! },
  );
}

async function sendViaBackend(p: QuoteLeadPayload): Promise<void> {
  const sourceLine = p.source ? `[${p.source}] ` : '';
  await submitLead({
    name: p.name,
    email: p.email,
    phone: p.phone,
    company: p.company || '',
    budget: 'No especificado',
    purchaseDate: 'No especificado',
    message: `${sourceLine}${p.message}`.trim() || undefined,
    inventoryUnitId: p.inventoryUnitId || undefined,
    serialNumber: p.serialNumber || undefined,
    source: p.source || undefined,
  });
}

/**
 * Delivers a quote lead. The backend is the primary channel: it stores the lead
 * and emails the sales team. EmailJS is only a fallback for when the backend
 * call fails, so a successful submission never sends two notifications.
 * Rejects with the backend error when both channels fail (or when the backend
 * fails and EmailJS is not configured), so the failure is not hidden.
 */
export async function sendQuoteLead(p: QuoteLeadPayload): Promise<void> {
  try {
    await sendViaBackend(p);
    return;
  } catch (backendError) {
    try {
      await sendViaEmailjs(p);
    } catch {
      throw backendError;
    }
  }
}
