import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubmitLead = vi.fn();
const mockEmailjsSend = vi.fn();

vi.mock('../api', () => ({ submitLead: (...args: unknown[]) => mockSubmitLead(...args) }));
vi.mock('@emailjs/browser', () => ({
  default: { send: (...args: unknown[]) => mockEmailjsSend(...args) },
}));

const payload = {
  name: 'Ana',
  company: 'Textiles SA',
  email: 'ana@example.com',
  phone: '2221234567',
  machine: 'Vesta Multi',
  message: 'Máquina de interés: Vesta Multi',
  source: 'home-quote',
};

/** Loads a fresh copy of the module so the EmailJS env vars are re-read. */
const loadService = async (emailjsConfigured: boolean) => {
  vi.resetModules();
  vi.stubEnv('VITE_EMAILJS_SERVICE_ID', emailjsConfigured ? 'service' : '');
  vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', emailjsConfigured ? 'template' : '');
  vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', emailjsConfigured ? 'key' : '');
  return import('../leads');
};

describe('sendQuoteLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitLead.mockResolvedValue({});
    mockEmailjsSend.mockResolvedValue({});
  });

  it('sends through the backend only when it succeeds, without a duplicate EmailJS notification', async () => {
    const { sendQuoteLead } = await loadService(true);

    await sendQuoteLead(payload);

    expect(mockSubmitLead).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana',
        email: 'ana@example.com',
        phone: '2221234567',
        company: 'Textiles SA',
        message: '[home-quote] Máquina de interés: Vesta Multi',
      }),
    );
    expect(mockEmailjsSend).not.toHaveBeenCalled();
  });

  it('falls back to EmailJS when the backend fails', async () => {
    mockSubmitLead.mockRejectedValue(new Error('backend down'));
    const { sendQuoteLead } = await loadService(true);

    await expect(sendQuoteLead(payload)).resolves.toBeUndefined();

    expect(mockEmailjsSend).toHaveBeenCalledTimes(1);
    expect(mockEmailjsSend).toHaveBeenCalledWith(
      'service',
      'template',
      expect.objectContaining({ from_name: 'Ana', reply_to: 'ana@example.com' }),
      { publicKey: 'key' },
    );
  });

  it('rejects with the backend error when both channels fail', async () => {
    mockSubmitLead.mockRejectedValue(new Error('backend down'));
    mockEmailjsSend.mockRejectedValue(new Error('emailjs down'));
    const { sendQuoteLead } = await loadService(true);

    await expect(sendQuoteLead(payload)).rejects.toThrow('backend down');
  });

  it('rejects with the backend error when it fails and EmailJS is not configured', async () => {
    mockSubmitLead.mockRejectedValue(new Error('backend down'));
    const { sendQuoteLead } = await loadService(false);

    await expect(sendQuoteLead(payload)).rejects.toThrow('backend down');
    expect(mockEmailjsSend).not.toHaveBeenCalled();
  });
});
