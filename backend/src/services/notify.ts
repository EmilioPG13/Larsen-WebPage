import nodemailer, { Transporter } from 'nodemailer';
import env from '../config/env';
import { MonthlyReport } from './inventory-report';
import { buildMonthlyReportEmail } from './report-email';

/** The subset of a `Lead` row the notification needs. */
export interface NotifiableLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  message?: string | null;
  createdAt: Date | string;
}

const SMTP_TIMEOUT_MS = 8000;
const DASH = '—';
const TIME_ZONE = 'America/Mexico_City';

// Reused across warm invocations of the serverless function. Built lazily so
// tests and the "not configured" path never open a socket.
let cachedTransport: Transporter | null = null;
let cachedTransportKey = '';

function getTransport(user: string, pass: string): Transporter {
  const key = [env.SMTP_HOST, env.SMTP_PORT, user, pass].join('\u0000');
  if (!cachedTransport || cachedTransportKey !== key) {
    cachedTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user, pass },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
    cachedTransportKey = key;
  }
  return cachedTransport;
}

/** Collapses CR/LF (and surrounding whitespace) so a value cannot inject headers. */
function singleLine(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, ' ').trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * The frontend prefixes the message with `[source] `. Splits it from the text.
 */
function parseMessage(raw: string | null | undefined): { source: string; text: string } {
  const message = (raw ?? '').trim();
  const match = /^\[([^\]\r\n]{1,60})\]\s*/.exec(message);
  if (!match) return { source: DASH, text: message };
  return { source: match[1].trim() || DASH, text: message.slice(match[0].length) };
}

/**
 * Best-effort machine extraction from lines such as `Máquina: X`,
 * `Máquina de interés: X` or `Machine: X`.
 */
function extractMachine(text: string): string | null {
  const match = /^[ \t]*(?:m[aá]quina(?:[ \t]+de[ \t]+inter[eé]s)?|machine)[ \t]*:[ \t]*(.+)$/im.exec(text);
  const machine = match ? singleLine(match[1]) : '';
  return machine || null;
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-MX', { timeZone: TIME_ZONE, dateStyle: 'long', timeStyle: 'short' });
}

/**
 * Emails the sales team about a new lead. Plain text only, so untrusted lead
 * fields cannot inject markup.
 *
 * Skips with a warning when SMTP is not configured. Throws on SMTP failure:
 * the caller must catch it so a mail problem never fails the request.
 */
export async function notifyNewLead(lead: NotifiableLead): Promise<void> {
  const { SMTP_USER, SMTP_PASS, LEAD_NOTIFY_EMAIL } = env;

  if (!SMTP_USER || !SMTP_PASS || !LEAD_NOTIFY_EMAIL) {
    console.warn('lead notification skipped: SMTP not configured');
    return;
  }

  const { source, text } = parseMessage(lead.message);
  const machine = extractMachine(text);

  const name = singleLine(lead.name);
  const subject = truncate(
    `Nueva cotización: ${name}${machine ? ` — ${machine}` : ''}`.replace(/\s+/g, ' '),
    200
  );

  const body = [
    'Llegó una nueva solicitud de cotización.',
    '',
    `Nombre: ${name}`,
    `Correo: ${singleLine(lead.email)}`,
    `Teléfono: ${singleLine(lead.phone)}`,
    `Empresa: ${singleLine(lead.company ?? '') || DASH}`,
    `Origen: ${source}`,
    '',
    'Mensaje:',
    text || DASH,
    '',
    `ID del lead: ${lead.id}`,
    `Fecha: ${formatDate(lead.createdAt)}`,
    '',
    `Ver en el panel: ${env.ADMIN_LEADS_URL}`,
    '',
  ].join('\n');

  await getTransport(SMTP_USER, SMTP_PASS).sendMail({
    from: `Larsen Italiana <${SMTP_USER}>`,
    to: LEAD_NOTIFY_EMAIL,
    replyTo: singleLine(lead.email),
    subject,
    text: body,
  });
}

/**
 * Emails the monthly inventory closing. Skips with a warning (and returns false) when SMTP is
 * not configured; throws on SMTP failure so the cron run is reported as failed.
 */
export async function notifyMonthlyReport(report: MonthlyReport): Promise<boolean> {
  const { SMTP_USER, SMTP_PASS } = env;
  const recipient = env.REPORT_NOTIFY_EMAIL ?? env.LEAD_NOTIFY_EMAIL;

  if (!SMTP_USER || !SMTP_PASS || !recipient) {
    console.warn('monthly report skipped: SMTP not configured');
    return false;
  }

  const { subject, text } = buildMonthlyReportEmail(report, env.ADMIN_REPORTS_URL);
  await getTransport(SMTP_USER, SMTP_PASS).sendMail({
    from: `Larsen Italiana <${SMTP_USER}>`,
    to: recipient,
    subject,
    text,
  });
  return true;
}
