import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSendMail, mockCreateTransport } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockCreateTransport: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

import { NodemailerEmailService } from '../../../infrastructure/services/NodemailerEmailService';

describe('NodemailerEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
    mockSendMail.mockResolvedValue({});
  });

  it('should send the 2FA code email', async () => {
    const service = new NodemailerEmailService();

    await service.sendTwoFactorCode('ana@example.com', '123456');

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'gmail' }),
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ana@example.com', subject: expect.stringContaining('código') }),
    );
    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).toContain('123456');
  });

  it('should send the password reset email', async () => {
    const service = new NodemailerEmailService();

    await service.sendPasswordResetEmail('ana@example.com', 'https://x/reset?t=1');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ana@example.com' }),
    );
    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).toContain('https://x/reset?t=1');
  });

  it('should throw EMAIL_SEND_ERROR on transport failure', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('smtp down'));
    const service = new NodemailerEmailService();

    await expect(service.sendTwoFactorCode('a@b.co', '123456')).rejects.toMatchObject({
      code: 'EMAIL_SEND_ERROR',
    });

    mockSendMail.mockRejectedValueOnce(new Error('smtp down'));
    await expect(service.sendPasswordResetEmail('a@b.co', 'link')).rejects.toMatchObject({
      code: 'EMAIL_SEND_ERROR',
    });
  });
});
