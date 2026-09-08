import { IEmailService } from '../../application/interfaces/IEmailService';
export interface SentTwoFactorEntry {
  email: string;
  code: string;
}
export interface SentResetEntry {
  email: string;
  resetLink: string;
}
export class FakeEmailService implements IEmailService {
  readonly sentTwoFactorCodes: SentTwoFactorEntry[] = [];
  readonly sentResetEmails: SentResetEntry[] = [];
  clear(): void {
    this.sentTwoFactorCodes.length = 0;
    this.sentResetEmails.length = 0;
  }
  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    this.sentTwoFactorCodes.push({ email, code });
  }
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    this.sentResetEmails.push({ email, resetLink });
  }
  wasCodeSentTo(email: string): boolean {
    return this.sentTwoFactorCodes.some((e) => e.email === email);
  }
  wasResetSentTo(email: string): boolean {
    return this.sentResetEmails.some((e) => e.email === email);
  }
}
