import {
  CONTACT,
  COLOR,
  EmailLang,
  FONT,
  FONT_DATA,
  button,
  emailShell,
  escapeHtml,
  heading,
  link,
  multilineHtml,
  paragraph,
  plate,
  rows,
  spacer,
} from './email-layout';

/** The subset of a `Lead` row the emails need. */
export interface NotifiableLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  /** Serial of the inventory unit the quote is about, when there is one. */
  serialNumber?: string | null;
  message?: string | null;
  createdAt: Date | string;
}

export interface BuiltEmail {
  subject: string;
  text: string;
  html: string;
}

const DASH = '—';
const TIME_ZONE = 'America/Mexico_City';

/** Collapses CR/LF (and surrounding whitespace) so a value cannot inject headers. */
export function singleLine(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, ' ').trim();
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** The frontend prefixes the message with `[source] `. Splits it from the text. */
export function parseMessage(raw: string | null | undefined): { source: string; text: string } {
  const message = (raw ?? '').trim();
  const match = /^\[([^\]\r\n]{1,60})\]\s*/.exec(message);
  if (!match) return { source: DASH, text: message };
  return { source: match[1].trim() || DASH, text: message.slice(match[0].length) };
}

// Lines such as `Máquina: X`, `Máquina de interés: X` or `Machine: X`.
const MACHINE_LINE = /^[ \t]*(?:m[aá]quina(?:[ \t]+de[ \t]+inter[eé]s)?|machine)[ \t]*:[ \t]*(.+)$/im;

/** Best-effort machine extraction from the message. */
export function extractMachine(text: string): string | null {
  const match = MACHINE_LINE.exec(text);
  const machine = match ? singleLine(match[1]) : '';
  return machine || null;
}

/** The message without the machine line, which the email shows on its own. */
const withoutMachineLine = (text: string): string => text.replace(MACHINE_LINE, '').replace(/^\s+/, '').trim();

function formatDate(value: Date | string, style: 'long' | 'medium' = 'long'): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-MX', { timeZone: TIME_ZONE, dateStyle: style, timeStyle: 'short' });
}

/** What the team reads for each `source` the site sends; anything else is shown as sent. */
const SOURCE_LABELS: Record<string, string> = {
  'home-quote': 'Formulario del inicio',
  quote: 'Página de cotización',
  'quote-form': 'Formulario de cotización',
  'catalog-interest': 'Interés desde el catálogo',
  'catalog-unit': 'Cotización de una unidad del catálogo',
  'spec-download': 'Descarga de ficha técnica',
};

const sourceLabel = (source: string): string => SOURCE_LABELS[source] ?? source;

/** Digits and a leading plus, or null when it cannot be a phone number. */
const dialable = (phone: string): string | null => {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 7 ? digits : null;
};

const firstName = (name: string): string => truncate(singleLine(name).split(/\s+/)[0] ?? '', 40);

// ---------------------------------------------------------------------------
// Internal: a new quote request, for the sales team
// ---------------------------------------------------------------------------

/**
 * The sales team's notification. The plain-text part keeps the original layout; the HTML
 * part puts the person and the machine first and the reply actions within reach.
 */
export function buildLeadNotificationEmail(
  lead: NotifiableLead,
  options: { adminLeadsUrl: string; siteUrl: string }
): BuiltEmail & { replyTo: string } {
  const { source, text: message } = parseMessage(lead.message);
  const machine = extractMachine(message);

  const name = singleLine(lead.name);
  const email = singleLine(lead.email);
  const phone = singleLine(lead.phone);
  const company = singleLine(lead.company ?? '');
  const serial = singleLine(lead.serialNumber ?? '');

  const subject = truncate(`Nueva cotización: ${name}${machine ? ` — ${machine}` : ''}`.replace(/\s+/g, ' '), 200);

  const text = [
    'Llegó una nueva solicitud de cotización.',
    '',
    `Nombre: ${name}`,
    `Correo: ${email}`,
    `Teléfono: ${phone}`,
    `Empresa: ${company || DASH}`,
    ...(serial ? [`Unidad (serie): ${serial}`] : []),
    `Origen: ${source}`,
    '',
    'Mensaje:',
    message || DASH,
    '',
    `ID del lead: ${lead.id}`,
    `Fecha: ${formatDate(lead.createdAt)}`,
    '',
    `Ver en el panel: ${options.adminLeadsUrl}`,
    '',
  ].join('\n');

  const note = withoutMachineLine(message);
  const dial = dialable(phone);
  const replySubject = `Cotización Larsen Italiana${machine ? ` — ${machine}` : ''}`;
  const who = firstName(name) || name;

  const subjectPlate = machine
    ? plate({ label: 'Máquina de interés', value: machine, detail: serial ? `Serie ${serial}` : undefined })
    : serial
      ? plate({ label: 'Unidad del inventario', value: `Serie ${serial}` })
      : '';

  const body = [
    heading(escapeHtml(name), 28),
    company
      ? `<p class="em-text" style="margin:0 0 4px 0;font-family:${FONT};font-size:16px;line-height:22px;color:${COLOR.text};">${escapeHtml(company)}</p>`
      : '',
    spacer(subjectPlate ? 22 : 8),
    subjectPlate,
    subjectPlate ? spacer(24) : '',
    rows([
      { label: 'Correo', html: link(`mailto:${email}`, email) },
      { label: 'Teléfono', html: dial ? link(`tel:${dial}`, phone) : escapeHtml(phone) },
      { label: 'Origen', html: escapeHtml(sourceLabel(source)) },
    ]),
    spacer(24),
    `<div class="em-muted" style="font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${COLOR.muted};padding-bottom:8px;">Mensaje</div>`,
    note
      ? paragraph(multilineHtml(note), 16)
      : `<p class="em-muted" style="margin:0 0 18px 0;font-family:${FONT};font-size:15px;line-height:22px;color:${COLOR.muted};">Sin mensaje adicional.</p>`,
    spacer(6),
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td>`,
    button({ href: `mailto:${email}?subject=${encodeURIComponent(replySubject)}`, label: `Responder a ${who}` }),
    dial ? button({ href: `tel:${dial}`, label: 'Llamar', variant: 'outline' }) : '',
    button({ href: options.adminLeadsUrl, label: 'Ver en el panel', variant: 'outline' }),
    `</td></tr></table>`,
  ].join('\n');

  const footer = [
    `<div style="font-family:${FONT};font-size:13px;line-height:20px;color:${COLOR.onNavyMuted};">Responde a este correo y tu mensaje le llegará directo a ${escapeHtml(who)}.</div>`,
    `<div style="font-family:${FONT_DATA};font-size:12px;line-height:20px;color:${COLOR.onNavyMuted};padding-top:6px;">ID del lead ${escapeHtml(lead.id)}</div>`,
  ].join('\n');

  const html = emailShell({
    lang: 'es',
    title: subject,
    preheader: [name, machine, phone].filter(Boolean).join(' · '),
    siteUrl: options.siteUrl,
    headerNote: formatDate(lead.createdAt, 'medium'),
    body,
    footer,
  });

  return { subject, text, html, replyTo: email };
}

// ---------------------------------------------------------------------------
// External: the automatic confirmation sent to the person who asked for a quote
// ---------------------------------------------------------------------------

interface ConfirmationCopy {
  subject: string;
  preheader: string;
  greeting: (name: string) => string;
  lead: string;
  yourRequest: string;
  talkTitle: string;
  talkBody: string;
  whatsapp: string;
  call: (phone: string) => string;
  writeUs: string;
  whatsappPrefill: (machine: string | null) => string;
  automatic: string;
}

const COPY: Record<EmailLang, ConfirmationCopy> = {
  es: {
    subject: 'Recibimos tu solicitud de cotización',
    preheader: 'Nuestro equipo se pondrá en contacto contigo lo más pronto posible.',
    greeting: (name) => (name ? `Gracias por tu interés, ${name}.` : 'Gracias por tu interés.'),
    lead: 'Recibimos tu solicitud de cotización. Nuestro equipo se pondrá en contacto contigo lo más pronto posible.',
    yourRequest: 'Tu solicitud',
    talkTitle: '¿Prefieres hablar ahora?',
    talkBody: 'Escríbenos por WhatsApp o llámanos, con gusto te atendemos.',
    whatsapp: 'Escribir por WhatsApp',
    call: (phone) => `Llamar al ${phone}`,
    writeUs: 'También puedes escribirnos a',
    whatsappPrefill: (machine) => `Hola, acabo de solicitar una cotización${machine ? ` de ${machine}` : ''}.`,
    automatic:
      'Es un mensaje automático que confirma tu solicitud en larsenitaliana.com. Si no fuiste tú, puedes ignorarlo.',
  },
  en: {
    subject: 'We received your quote request',
    preheader: 'Our team will get in touch with you as soon as possible.',
    greeting: (name) => (name ? `Thank you for your interest, ${name}.` : 'Thank you for your interest.'),
    lead: 'We received your quote request. Our team will get in touch with you as soon as possible.',
    yourRequest: 'Your request',
    talkTitle: 'Prefer to talk now?',
    talkBody: 'Message us on WhatsApp or give us a call, we are happy to help.',
    whatsapp: 'Message us on WhatsApp',
    call: (phone) => `Call ${phone}`,
    writeUs: 'You can also write to us at',
    whatsappPrefill: (machine) => `Hi, I just requested a quote${machine ? ` for ${machine}` : ''}.`,
    automatic:
      'This is an automatic message confirming your request on larsenitaliana.com. If it was not you, you can ignore it.',
  },
};

/**
 * The acknowledgement for the person who asked for a quote. It repeats only the machine or
 * unit (never their free-text message: the address could have been typed by someone else)
 * and points to the sales WhatsApp and phone.
 */
export function buildLeadConfirmationEmail(
  lead: NotifiableLead,
  lang: EmailLang,
  options: { siteUrl: string }
): BuiltEmail {
  const copy = COPY[lang];
  const { text: message } = parseMessage(lead.message);
  const machine = extractMachine(message);
  const serial = singleLine(lead.serialNumber ?? '');
  const serialLabel = lang === 'en' ? 'Serial' : 'Serie';
  const whatsappUrl = `${CONTACT.whatsappBase}?text=${encodeURIComponent(copy.whatsappPrefill(machine))}`;
  const location = CONTACT.location[lang];
  const name = firstName(lead.name);

  const text = [
    copy.greeting(name),
    '',
    copy.lead,
    ...(machine || serial
      ? ['', `${copy.yourRequest}: ${[machine, serial ? `${serialLabel} ${serial}` : ''].filter(Boolean).join(' · ')}`]
      : []),
    '',
    copy.talkTitle,
    `${copy.talkBody}`,
    `WhatsApp: ${whatsappUrl}`,
    `${CONTACT.phoneLabel}`,
    `${copy.writeUs} ${CONTACT.email}`,
    '',
    'Larsen Italiana',
    location,
    options.siteUrl,
    '',
    copy.automatic,
    '',
  ].join('\n');

  const requestPlate =
    machine || serial
      ? [
          plate({
            label: copy.yourRequest,
            value: machine ?? `${serialLabel} ${serial}`,
            detail: machine && serial ? `${serialLabel} ${serial}` : undefined,
          }),
          spacer(28),
        ].join('\n')
      : '';

  const body = [
    heading(escapeHtml(copy.greeting(name)), 28),
    spacer(14),
    paragraph(escapeHtml(copy.lead), 17),
    spacer(6),
    requestPlate,
    `<div class="em-ink" style="font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;color:${COLOR.ink};padding-bottom:6px;">${escapeHtml(copy.talkTitle)}</div>`,
    paragraph(escapeHtml(copy.talkBody), 16),
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td>`,
    button({ href: whatsappUrl, label: copy.whatsapp }),
    button({ href: CONTACT.phoneHref, label: copy.call(CONTACT.phoneLabel), variant: 'outline' }),
    `</td></tr></table>`,
    paragraph(`${escapeHtml(copy.writeUs)} ${link(`mailto:${CONTACT.email}`, CONTACT.email)}.`, 15),
  ].join('\n');

  const footer = [
    `<div style="font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:${COLOR.onNavy};">Larsen Italiana</div>`,
    `<div style="font-family:${FONT};font-size:13px;line-height:20px;color:${COLOR.onNavyMuted};">${escapeHtml(location)} · <a href="${escapeHtml(options.siteUrl)}" style="color:${COLOR.onNavy};text-decoration:underline;">larsenitaliana.com</a></div>`,
    `<div style="font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.onNavyMuted};padding-top:12px;">${escapeHtml(copy.automatic)}</div>`,
  ].join('\n');

  const html = emailShell({
    lang,
    title: copy.subject,
    preheader: copy.preheader,
    siteUrl: options.siteUrl,
    body,
    footer,
  });

  return { subject: copy.subject, text, html };
}
