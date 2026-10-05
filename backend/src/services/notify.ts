import nodemailer, { Transporter } from 'nodemailer';
import env from '../config/env';
import { MonthlyReport } from './inventory-report';
import { buildMonthlyReportEmail } from './report-email';
import { EmailLang } from './email-layout';
import {
  NotifiableLead,
  buildLeadConfirmationEmail,
  buildLeadNotificationEmail,
  singleLine,
} from './lead-email';

export type { NotifiableLead } from './lead-email';

const SMTP_TIMEOUT_MS = 8000;

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

/**
 * Emails the sales team about a new lead: HTML with a plain-text fallback. Every lead field
 * is escaped in the markup, so untrusted input cannot inject anything.
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

  const { subject, text, html, replyTo } = buildLeadNotificationEmail(lead, {
    adminLeadsUrl: env.ADMIN_LEADS_URL,
    siteUrl: env.SITE_URL,
  });

  await getTransport(SMTP_USER, SMTP_PASS).sendMail({
    from: `Larsen Italiana <${SMTP_USER}>`,
    to: LEAD_NOTIFY_EMAIL,
    replyTo,
    subject,
    text,
    html,
  });
}

/**
 * Sends the person who asked for a quote an automatic acknowledgement, in their language.
 * Replies go to the sales mailbox (the sender). Skips with a warning (and returns false) when
 * SMTP is not configured; throws on SMTP failure: the caller must catch it.
 */
export async function sendLeadConfirmation(lead: NotifiableLead, lang: EmailLang): Promise<boolean> {
  const { SMTP_USER, SMTP_PASS } = env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('lead confirmation skipped: SMTP not configured');
    return false;
  }

  const { subject, text, html } = buildLeadConfirmationEmail(lead, lang, { siteUrl: env.SITE_URL });

  await getTransport(SMTP_USER, SMTP_PASS).sendMail({
    from: `Larsen Italiana <${SMTP_USER}>`,
    to: singleLine(lead.email),
    subject,
    text,
    html,
    // RFC 3834: tells out-of-office and other auto-responders not to answer this message.
    headers: { 'Auto-Submitted': 'auto-generated' },
  });
  return true;
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
