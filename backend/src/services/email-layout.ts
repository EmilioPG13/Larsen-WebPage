/**
 * Building blocks for the HTML emails: a table-based shell with inline styles (the only
 * thing mail clients agree on), a bulletproof button and a label/value plate. Every
 * value that reaches the markup goes through `escapeHtml`; nothing here executes or loads
 * anything except the logo.
 *
 * The look follows the public site: Larsen navy header with the logo in its official colors and a white die-cut outline, square
 * corners, 1px hairlines and red reserved for the one action that matters.
 */

export type EmailLang = 'es' | 'en';

export const parseEmailLang = (value: unknown): EmailLang => (value === 'en' ? 'en' : 'es');

/**
 * Contact details shown to customers. Keep in sync with `telNum`, `WHATSAPP_NUMBER` and
 * the footer in the frontend (src/i18n/dictionary.ts, src/utils/whatsapp.ts).
 */
export const CONTACT = {
  phoneLabel: '+52 775 365 0376',
  phoneHref: 'tel:+527753650376',
  whatsappBase: 'https://wa.me/527753650376',
  email: 'admin@larsenitaliana.com',
  location: { es: 'Cuautepec de Hinojosa, Hidalgo · México', en: 'Cuautepec de Hinojosa, Hidalgo · Mexico' },
} as const;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

/** Escapes text and keeps its line breaks. */
export const multilineHtml = (value: string): string =>
  escapeHtml(value.replace(/\r\n?/g, '\n')).replace(/\n/g, '<br>');

// Palette: the public site's tokens (src/index.css) written out, since email has no variables.
export const COLOR = {
  nav: '#1e276b',
  footer: '#131a4f',
  blue: '#28327B',
  red: '#D81E2A',
  ground: '#ECEDF0',
  surface: '#ffffff',
  plate: '#f5f6fa',
  ink: '#1b1c20',
  text: '#3d4050',
  muted: '#5d6171',
  line: '#d9dbe3',
  onNavy: '#ffffff',
  onNavyMuted: '#b9bfe6',
} as const;

export const FONT = "'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif";
export const FONT_DATA = "'Red Hat Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Wider than any real client viewport would crop it, narrow enough to read on a phone. */
const CARD_WIDTH = 600;

export const logoUrl = (siteUrl: string): string => `${siteUrl.replace(/\/+$/, '')}/images/logo/larsen-logo-email.png`;

interface ButtonOptions {
  href: string;
  label: string;
  variant?: 'primary' | 'outline';
}

/** A button as a table cell: the background and padding survive Outlook's Word renderer. */
export const button = ({ href, label, variant = 'primary' }: ButtonOptions): string => {
  const primary = variant === 'primary';
  const fill = primary ? COLOR.red : COLOR.surface;
  const edge = primary ? COLOR.red : COLOR.blue;
  const ink = primary ? COLOR.onNavy : COLOR.blue;
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" class="em-btn" style="margin:0 12px 12px 0;">` +
    `<tr><td bgcolor="${fill}"${primary ? '' : ' class="em-btn-o"'} style="background-color:${fill};border:1px solid ${edge};mso-padding-alt:13px 22px;">` +
    `<a href="${escapeHtml(href)}"${primary ? '' : ' class="em-btn-o"'} style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:15px;line-height:18px;font-weight:700;color:${ink};text-decoration:none;">${escapeHtml(label)}</a>` +
    `</td></tr></table>`
  );
};

interface PlateOptions {
  label: string;
  value: string;
  /** Shown under the value in the data face (a serial number). */
  detail?: string;
}

/** The headline fact of the email (the machine the quote is about), on a soft plate. */
export const plate = ({ label, value, detail }: PlateOptions): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-plate" style="background-color:${COLOR.plate};border:1px solid ${COLOR.line};">` +
  `<tr><td style="padding:16px 20px;">` +
  `<div class="em-muted" style="font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${COLOR.muted};">${escapeHtml(label)}</div>` +
  `<div class="em-ink" style="font-family:${FONT};font-size:20px;line-height:26px;font-weight:700;color:${COLOR.ink};padding-top:4px;">${escapeHtml(value)}</div>` +
  (detail
    ? `<div class="em-text" style="font-family:${FONT_DATA};font-size:14px;line-height:20px;color:${COLOR.text};padding-top:4px;">${escapeHtml(detail)}</div>`
    : '') +
  `</td></tr></table>`;

interface Row {
  label: string;
  /** Already-escaped HTML (it may carry a link). */
  html: string;
}

/** Label-left, value-right rows separated by hairlines. */
export const rows = (items: Row[]): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
  items
    .map(
      (item, index) =>
        `<tr>` +
        `<td class="em-muted em-line" width="112" valign="top" style="padding:12px 12px 12px 0;${index > 0 ? `border-top:1px solid ${COLOR.line};` : ''}font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:${COLOR.muted};">${escapeHtml(item.label)}</td>` +
        `<td class="em-ink em-line" valign="top" style="padding:12px 0;${index > 0 ? `border-top:1px solid ${COLOR.line};` : ''}font-family:${FONT};font-size:15px;line-height:20px;color:${COLOR.ink};word-break:break-word;">${item.html}</td>` +
        `</tr>`
    )
    .join('') +
  `</table>`;

export const link = (href: string, text: string): string =>
  `<a href="${escapeHtml(href)}" class="em-link" style="color:${COLOR.blue};text-decoration:underline;">${escapeHtml(text)}</a>`;

interface ShellOptions {
  lang: EmailLang;
  title: string;
  /** Inbox preview text; hidden in the body. */
  preheader: string;
  siteUrl: string;
  /** Short text on the right of the header (a date). Already plain text. */
  headerNote?: string;
  /** Inner HTML of the white card. */
  body: string;
  /** Inner HTML of the footer band, set on navy. */
  footer: string;
}

/**
 * The full document. Light by default; clients that honour `prefers-color-scheme` get the
 * public site's dark tokens, with the navy bands unchanged.
 */
export const emailShell = ({ lang, title, preheader, siteUrl, headerNote, body, footer }: ShellOptions): string => `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; padding: 0; }
  table { border-collapse: collapse; }
  a { overflow-wrap: anywhere; }
  @media (max-width: 620px) {
    .em-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .em-head { padding-left: 20px !important; padding-right: 20px !important; }
    .em-outer { padding: 0 !important; }
  }
  @media (prefers-color-scheme: dark) {
    .em-ground { background-color: #121318 !important; }
    .em-card { background-color: #1d1e26 !important; border-color: rgba(255,255,255,0.16) !important; }
    .em-plate { background-color: #252733 !important; border-color: rgba(255,255,255,0.16) !important; }
    .em-ink { color: #F2EFE9 !important; }
    .em-text { color: #d6d3cc !important; }
    .em-muted { color: #a9acbd !important; }
    .em-line { border-color: rgba(255,255,255,0.16) !important; }
    .em-link { color: #94A0F0 !important; }
    td.em-btn-o { background-color: transparent !important; border-color: #94A0F0 !important; }
    a.em-btn-o { color: #94A0F0 !important; }
  }
</style>
</head>
<body class="em-ground" style="margin:0;padding:0;background-color:${COLOR.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-ground" style="background-color:${COLOR.ground};">
<tr><td align="center" class="em-outer" style="padding:28px 12px;">
  <table role="presentation" width="${CARD_WIDTH}" cellpadding="0" cellspacing="0" border="0" class="em-card" style="width:100%;max-width:${CARD_WIDTH}px;background-color:${COLOR.surface};border:1px solid ${COLOR.line};">
    <tr><td bgcolor="${COLOR.nav}" class="em-head" style="background-color:${COLOR.nav};padding:20px 28px;border-bottom:3px solid ${COLOR.red};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle"><a href="${escapeHtml(siteUrl)}" style="text-decoration:none;"><img src="${escapeHtml(logoUrl(siteUrl))}" width="120" height="55" alt="Larsen Italiana" style="display:block;border:0;width:120px;height:auto;font-family:${FONT};font-size:16px;line-height:22px;font-weight:700;color:${COLOR.onNavy};"></a></td>
        ${headerNote ? `<td valign="middle" align="right" style="font-family:${FONT};font-size:13px;line-height:18px;color:${COLOR.onNavyMuted};">${escapeHtml(headerNote)}</td>` : ''}
      </tr></table>
    </td></tr>
    <tr><td class="em-pad" style="padding:32px 28px 12px 28px;">
${body}
    </td></tr>
    <tr><td bgcolor="${COLOR.footer}" class="em-pad" style="background-color:${COLOR.footer};padding:22px 28px;font-family:${FONT};font-size:13px;line-height:20px;color:${COLOR.onNavyMuted};">
${footer}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
`;

/** A paragraph in the body face. */
export const paragraph = (html: string, size = 16): string =>
  `<p class="em-text" style="margin:0 0 18px 0;font-family:${FONT};font-size:${size}px;line-height:${Math.round(size * 1.6)}px;color:${COLOR.text};">${html}</p>`;

/** A heading in the body face. */
export const heading = (html: string, size = 26): string =>
  `<h1 class="em-ink" style="margin:0 0 6px 0;font-family:${FONT};font-size:${size}px;line-height:${Math.round(size * 1.2)}px;font-weight:700;letter-spacing:-0.01em;color:${COLOR.ink};">${html}</h1>`;

/** Vertical space, as a table so every client honours it. */
export const spacer = (height: number): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="${height}" style="height:${height}px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
