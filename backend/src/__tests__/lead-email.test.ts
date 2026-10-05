import { parseEmailLang } from '../services/email-layout';
import { buildLeadConfirmationEmail, buildLeadNotificationEmail } from '../services/lead-email';

const options = { adminLeadsUrl: 'https://larsenitaliana.com/admin/leads', siteUrl: 'https://larsenitaliana.com' };

const lead = {
  id: 'lead-1',
  name: 'Jon Doe',
  email: 'jon@example.com',
  phone: '222 123 4567',
  company: 'Doe SA',
  message: '[home-quote] Máquina de interés: Vesta Multi\nThis is a test.',
  createdAt: new Date('2026-10-05T16:27:00.000Z'),
};

describe('parseEmailLang', () => {
  it.each([
    ['en', 'en'],
    ['es', 'es'],
    ['fr', 'es'],
    [undefined, 'es'],
    [{ lang: 'en' }, 'es'],
  ])('maps %j to %s', (value, expected) => {
    expect(parseEmailLang(value)).toBe(expected);
  });
});

describe('buildLeadNotificationEmail', () => {
  it('shows the person, the machine and the reply actions', () => {
    const { html, replyTo } = buildLeadNotificationEmail(lead, options);

    expect(replyTo).toBe('jon@example.com');
    expect(html).toContain('>Jon Doe</h1>');
    expect(html).toContain('Doe SA');
    expect(html).toContain('Vesta Multi');
    expect(html).toContain('Formulario del inicio');
    expect(html).toContain('href="mailto:jon@example.com"');
    expect(html).toContain('href="tel:2221234567"');
    expect(html).toContain('Responder a Jon');
    expect(html).toContain('href="https://larsenitaliana.com/admin/leads"');
    expect(html).toContain('subject=Cotizaci%C3%B3n%20Larsen%20Italiana%20%E2%80%94%20Vesta%20Multi');
  });

  it('shows the message once, without the machine line it already shows on its own', () => {
    const { html } = buildLeadNotificationEmail(lead, options);

    expect(html).toContain('This is a test.');
    expect(html).not.toContain('Máquina de interés: Vesta Multi');
  });

  it('names the unit serial, and says so when there is no message', () => {
    const { html } = buildLeadNotificationEmail(
      { ...lead, serialNumber: '6212/05', message: '[catalog-unit] Máquina de interés: Steiger' },
      options
    );

    expect(html).toContain('Serie 6212/05');
    expect(html).toContain('Sin mensaje adicional.');
  });

  it('shows a source it does not know as it was sent', () => {
    const { html } = buildLeadNotificationEmail({ ...lead, message: '[weird-source] hola' }, options);

    expect(html).toContain('weird-source');
  });

  it('does not link a phone that cannot be dialled', () => {
    const { html } = buildLeadNotificationEmail({ ...lead, phone: 'ext 12' }, options);

    expect(html).not.toContain('href="tel:');
    expect(html).not.toContain('>Llamar<');
  });

  it('escapes every lead field in the markup', () => {
    const payload = '<script>alert(1)</script>';
    const { html } = buildLeadNotificationEmail(
      {
        ...lead,
        name: payload,
        company: payload,
        phone: '"><img src=x onerror=alert(1)> 5551234567',
        message: `[x] Machine: ${payload}\n${payload}`,
        serialNumber: payload,
      },
      options
    );

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('keeps the plain-text part of the original notification', () => {
    const { text } = buildLeadNotificationEmail(lead, options);

    expect(text).toContain('Llegó una nueva solicitud de cotización.');
    expect(text).toContain('Nombre: Jon Doe');
    expect(text).toContain('Máquina de interés: Vesta Multi\nThis is a test.');
    expect(text).toContain('Ver en el panel: https://larsenitaliana.com/admin/leads');
  });
});

describe('buildLeadConfirmationEmail', () => {
  it('thanks the person by first name, without promising a time', () => {
    const { subject, html, text } = buildLeadConfirmationEmail(lead, 'es', options);

    expect(subject).toBe('Recibimos tu solicitud de cotización');
    expect(html).toContain('Gracias por tu interés, Jon.');
    expect(text).toContain('se pondrá en contacto contigo lo más pronto posible');
    expect(text).not.toMatch(/\b\d+\s*(horas|días|hours|days)\b/i);
  });

  it('repeats the machine and serial, but never the free-text message', () => {
    const { html, text } = buildLeadConfirmationEmail(
      { ...lead, serialNumber: '6212/05', message: '[quote] Máquina: Vesta Multi\nMi presupuesto es secreto' },
      'es',
      options
    );

    expect(html).toContain('Vesta Multi');
    expect(html).toContain('Serie 6212/05');
    expect(html).not.toContain('secreto');
    expect(text).not.toContain('secreto');
  });

  it('omits the request plate when the quote names no machine or unit', () => {
    const { html } = buildLeadConfirmationEmail({ ...lead, message: 'Solo información' }, 'es', options);

    expect(html).not.toContain('Tu solicitud');
  });

  it('points to the sales WhatsApp and phone, with the machine in the prefilled message', () => {
    const { html } = buildLeadConfirmationEmail(lead, 'es', options);

    expect(html).toContain(
      'https://wa.me/527753650376?text=Hola%2C%20acabo%20de%20solicitar%20una%20cotizaci%C3%B3n%20de%20Vesta%20Multi.'
    );
    expect(html).toContain('href="tel:+527753650376"');
    expect(html).toContain('admin@larsenitaliana.com');
  });

  it('is fully available in English', () => {
    const { subject, html, text } = buildLeadConfirmationEmail({ ...lead, serialNumber: '6212/05' }, 'en', options);

    expect(subject).toBe('We received your quote request');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Thank you for your interest, Jon.');
    expect(html).toContain('Serial 6212/05');
    expect(html).toContain('Hi%2C%20I%20just%20requested%20a%20quote%20for%20Vesta%20Multi.');
    expect(text).toContain('as soon as possible');
    expect(html).not.toContain('Gracias');
  });

  it('drops the name from the greeting when there is none to use', () => {
    const { html } = buildLeadConfirmationEmail({ ...lead, name: '  ' }, 'es', options);

    expect(html).toContain('Gracias por tu interés.');
  });

  it('escapes the name in the markup', () => {
    const { html } = buildLeadConfirmationEmail({ ...lead, name: '<b onmouseover=alert(1)>x</b>' }, 'es', options);

    expect(html).not.toContain('<b onmouseover');
  });
});
