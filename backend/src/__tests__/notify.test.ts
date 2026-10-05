const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: (...args: unknown[]) => (mockCreateTransport as any)(...args) },
}));

const baseEnv = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 465,
  SMTP_USER: 'ventas@larsenitaliana.com',
  SMTP_PASS: 'app-password',
  LEAD_NOTIFY_EMAIL: 'admin@larsenitaliana.com',
  ADMIN_LEADS_URL: 'https://larsenitaliana.com/admin/leads',
};
const mockEnv: Record<string, unknown> = { ...baseEnv };

jest.mock('../config/env', () => ({ __esModule: true, default: mockEnv }));

const lead = {
  id: 'lead-1',
  name: 'Ana Pérez',
  email: 'ana@example.com',
  phone: '+52 55 1234 5678',
  company: 'Textiles Ana',
  message: '[quote-form] Máquina: Vesta 130E\nNecesito precio y tiempos de entrega.',
  createdAt: new Date('2026-10-06T18:30:00.000Z'),
};

// The transport is cached at module level, so load a fresh module per test.
function loadNotify(): typeof import('../services/notify') {
  let mod!: typeof import('../services/notify');
  jest.isolateModules(() => {
    mod = require('../services/notify');
  });
  return mod;
}

describe('notifyNewLead', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockEnv, baseEnv);
    mockSendMail.mockResolvedValue({ messageId: 'x' });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each(['SMTP_USER', 'SMTP_PASS', 'LEAD_NOTIFY_EMAIL'])(
    'skips with a warning and opens no transport when %s is missing',
    async (key) => {
      mockEnv[key] = undefined;
      const { notifyNewLead } = loadNotify();

      await expect(notifyNewLead(lead)).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('lead notification skipped: SMTP not configured');
      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    }
  );

  it('sends one plain-text email with the expected envelope and body', async () => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead(lead);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.from).toBe('Larsen Italiana <ventas@larsenitaliana.com>');
    expect(mail.to).toBe('admin@larsenitaliana.com');
    expect(mail.replyTo).toBe('ana@example.com');
    expect(mail.subject).toBe('Nueva cotización: Ana Pérez — Vesta 130E');
    expect(mail.html).toBeUndefined();
    expect(mail.text).toContain('Nombre: Ana Pérez');
    expect(mail.text).toContain('Correo: ana@example.com');
    expect(mail.text).toContain('Teléfono: +52 55 1234 5678');
    expect(mail.text).toContain('Empresa: Textiles Ana');
    expect(mail.text).toContain('Origen: quote-form');
    expect(mail.text).toContain('Máquina: Vesta 130E\nNecesito precio y tiempos de entrega.');
    expect(mail.text).not.toContain('[quote-form]');
    expect(mail.text).toContain('ID del lead: lead-1');
    expect(mail.text).toContain('Fecha: ');
    expect(mail.text).toContain('https://larsenitaliana.com/admin/leads');
  });

  it('uses dashes for missing company, source and message', async () => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead({ ...lead, company: '', message: null });

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.text).toContain('Empresa: —');
    expect(mail.text).toContain('Origen: —');
    expect(mail.subject).toBe('Nueva cotización: Ana Pérez');
  });

  it('strips CR/LF from the subject and reply-to', async () => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead({
      ...lead,
      name: 'Eve\r\nBcc: attacker@evil.com',
      email: 'eve@example.com\r\nBcc: attacker@evil.com',
      message: 'Machine: Vesta\r\nBcc: attacker@evil.com',
    });

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.replyTo).not.toMatch(/[\r\n]/);
    expect(mail.subject).toBe('Nueva cotización: Eve Bcc: attacker@evil.com — Vesta');
  });

  it.each([
    ['Máquina: Aries.3', 'Aries.3'],
    ['Machine: Aries.6', 'Aries.6'],
    ['Máquina de interés: Vesta 130E', 'Vesta 130E'],
    ['[catalog-interest] Máquina de interés: Vesta 130E\nHola', 'Vesta 130E'],
    ['Hola\nmáquina:   Shima SWG  \nGracias', 'Shima SWG'],
  ])('extracts the machine from %j', async (message, machine) => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead({ ...lead, message });

    expect(mockSendMail.mock.calls[0][0].subject).toBe(`Nueva cotización: Ana Pérez — ${machine}`);
  });

  it('omits the machine when the message has none', async () => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead({ ...lead, message: 'Solo quiero información general' });

    expect(mockSendMail.mock.calls[0][0].subject).toBe('Nueva cotización: Ana Pérez');
  });

  it('configures the transport with host, auth and short timeouts', async () => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead(lead);

    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'ventas@larsenitaliana.com', pass: 'app-password' },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
  });

  it.each([
    [465, true],
    [587, false],
    [25, false],
  ])('sets secure for port %i to %s', async (port, secure) => {
    mockEnv.SMTP_PORT = port;
    const { notifyNewLead } = loadNotify();

    await notifyNewLead(lead);

    expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({ port, secure }));
  });

  it('reuses the cached transport across calls', async () => {
    const { notifyNewLead } = loadNotify();

    await notifyNewLead(lead);
    await notifyNewLead(lead);

    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it('propagates SMTP failures so the caller can handle them', async () => {
    mockSendMail.mockRejectedValue(new Error('connect ETIMEDOUT'));
    const { notifyNewLead } = loadNotify();

    await expect(notifyNewLead(lead)).rejects.toThrow('connect ETIMEDOUT');
  });
});

describe('notifyMonthlyReport', () => {
  const monthly = {
    month: '2026-09',
    summary: { arrivals: 1, sales: 0, reservations: 0, stockAtClose: { available: 3, reserved: 0, total: 3 } },
    sales: [],
    responseTime: { measured: 0, sameDay: 0, averageDays: null, worstDays: null, notMeasurable: 0 },
    aging: { onHand: 3, withReceivedDate: 0, withoutReceivedDate: 3, averageDays: null, oldest: [], averageDaysToSell: null },
    staleAfterDays: 15,
    staleReservations: [],
  };
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockEnv, baseEnv, { ADMIN_REPORTS_URL: 'https://larsenitaliana.com/admin/reportes' });
    delete mockEnv.REPORT_NOTIFY_EMAIL;
    mockSendMail.mockResolvedValue({ messageId: 'x' });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each(['SMTP_USER', 'SMTP_PASS', 'LEAD_NOTIFY_EMAIL'])(
    'skips with a warning and returns false when %s is missing and there is no other recipient',
    async (key) => {
      mockEnv[key] = undefined;
      const { notifyMonthlyReport } = loadNotify();

      await expect(notifyMonthlyReport(monthly)).resolves.toBe(false);

      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('monthly report skipped'));
    }
  );

  it('sends the closing to the lead inbox when no report recipient is set', async () => {
    const { notifyMonthlyReport } = loadNotify();

    await expect(notifyMonthlyReport(monthly)).resolves.toBe(true);

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('admin@larsenitaliana.com');
    expect(mail.from).toBe('Larsen Italiana <ventas@larsenitaliana.com>');
    expect(mail.subject).toBe('Cierre de inventario: Septiembre 2026');
    expect(mail.text).toContain('Llegadas: 1');
    expect(mail.text).toContain('Ver en el panel: https://larsenitaliana.com/admin/reportes');
  });

  it('prefers REPORT_NOTIFY_EMAIL when it is set, and works without a lead inbox then', async () => {
    mockEnv.REPORT_NOTIFY_EMAIL = 'direccion@larsenitaliana.com';
    mockEnv.LEAD_NOTIFY_EMAIL = undefined;
    const { notifyMonthlyReport } = loadNotify();

    await expect(notifyMonthlyReport(monthly)).resolves.toBe(true);

    expect(mockSendMail.mock.calls[0][0].to).toBe('direccion@larsenitaliana.com');
  });

  it('lets an SMTP failure through so the cron run fails visibly', async () => {
    mockSendMail.mockRejectedValue(new Error('connection refused'));
    const { notifyMonthlyReport } = loadNotify();

    await expect(notifyMonthlyReport(monthly)).rejects.toThrow('connection refused');
  });
});
