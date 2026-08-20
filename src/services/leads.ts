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
  });
}

/**
 * Delivers a quote lead through every configured channel (backend store +
 * EmailJS notification). Resolves if at least one channel succeeds, so the
 * form keeps working when the backend is offline (e.g. static deploy) as long
 * as EmailJS is configured, and vice-versa. Rejects only if all channels fail.
 */
export async function sendQuoteLead(p: QuoteLeadPayload): Promise<void> {
  const results = await Promise.allSettled([sendViaBackend(p), sendViaEmailjs(p)]);

  if (results.some((r) => r.status === 'fulfilled')) return;

  const firstError = results.find((r) => r.status === 'rejected') as
    | PromiseRejectedResult
    | undefined;
  throw firstError?.reason ?? new Error('No lead delivery channel is available');
}
