// config/env parses process.env at import time, so provide the required
// variables first (a plain `import` would be hoisted above these lines).
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- must load after the variables above
const { envSchema } = require('../config/env') as typeof import('../config/env');

const required = { DATABASE_URL: 'postgresql://x', JWT_SECRET: 'secret' };

describe('env schema (notification settings)', () => {
  it('accepts an environment with no SMTP variables and applies defaults', () => {
    const env = envSchema.parse(required);

    expect(env.SMTP_HOST).toBe('smtp.gmail.com');
    expect(env.SMTP_PORT).toBe(465);
    expect(env.SMTP_USER).toBeUndefined();
    expect(env.SMTP_PASS).toBeUndefined();
    expect(env.LEAD_NOTIFY_EMAIL).toBeUndefined();
    expect(env.ADMIN_LEADS_URL).toBe('https://larsenitaliana.com/admin/leads');
    expect(env.SITE_URL).toBe('https://larsenitaliana.com');
  });

  it('treats empty strings as missing', () => {
    const env = envSchema.parse({
      ...required,
      SMTP_HOST: '',
      SMTP_PORT: '',
      SMTP_USER: '',
      SMTP_PASS: '',
      LEAD_NOTIFY_EMAIL: '',
      ADMIN_LEADS_URL: '',
      SITE_URL: '',
    });

    expect(env.SMTP_HOST).toBe('smtp.gmail.com');
    expect(env.SMTP_PORT).toBe(465);
    expect(env.SMTP_USER).toBeUndefined();
    expect(env.SMTP_PASS).toBeUndefined();
    expect(env.LEAD_NOTIFY_EMAIL).toBeUndefined();
    expect(env.ADMIN_LEADS_URL).toBe('https://larsenitaliana.com/admin/leads');
    expect(env.SITE_URL).toBe('https://larsenitaliana.com');
  });

  it('coerces SMTP_PORT and keeps provided values', () => {
    const env = envSchema.parse({
      ...required,
      SMTP_PORT: '587',
      SMTP_USER: 'ventas@larsenitaliana.com',
      LEAD_NOTIFY_EMAIL: 'admin@larsenitaliana.com',
    });

    expect(env.SMTP_PORT).toBe(587);
    expect(env.SMTP_USER).toBe('ventas@larsenitaliana.com');
    expect(env.LEAD_NOTIFY_EMAIL).toBe('admin@larsenitaliana.com');
  });
});
