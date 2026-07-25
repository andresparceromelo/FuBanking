import nodemailer from 'nodemailer';
import { IEmailService } from '../../application/interfaces/IEmailService';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/errors/AppError';

/**
 * Implementación del servicio de email usando Nodemailer con Gmail.
 *
 * Implementa IEmailService de la capa de aplicación.
 */
export class NodemailerEmailService implements IEmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.GMAIL_USSER, // usser with two 's' as specified in .env
        pass: env.GMAIL_PASS,
      },
    });
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Banco Digital" <${env.GMAIL_USSER}>`,
        to: email,
        subject: '🔐 Tu código de seguridad — Banco Digital',
        html: this.buildEmailTemplate(code),
      });
    } catch (error: any) {
      throw new AppError(
        `Error al enviar el correo de verificación: ${error.message}`,
        500,
        'EMAIL_SEND_ERROR',
      );
    }
  }

  private buildEmailTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Código de seguridad</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0a0a0a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #e5e5e5;
      padding: 40px 16px;
    }
    .wrapper {
      max-width: 480px;
      margin: 0 auto;
    }
    .card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border-radius: 20px;
      border: 1px solid rgba(138, 43, 226, 0.3);
      padding: 48px 40px;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(138, 43, 226, 0.1);
    }
    .logo-area {
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #8a2be2, #6a0dad);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 16px;
    }
    .bank-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #c084fc, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .title {
      font-size: 15px;
      color: #a1a1aa;
      font-weight: 500;
      margin-bottom: 32px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .code-box {
      background: rgba(138, 43, 226, 0.08);
      border: 2px solid rgba(138, 43, 226, 0.4);
      border-radius: 16px;
      padding: 28px 24px;
      margin: 0 auto 32px;
    }
    .code {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 20px rgba(192, 132, 252, 0.5);
    }
    .expiry {
      font-size: 13px;
      color: #71717a;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .expiry strong {
      color: #c084fc;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.3), transparent);
      margin: 24px 0;
    }
    .warning {
      font-size: 12px;
      color: #52525b;
      line-height: 1.6;
    }
    .warning strong {
      color: #71717a;
    }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: #3f3f46;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-area">
        <div class="logo-icon">🏦</div>
        <div class="bank-name">Banco Digital</div>
      </div>

      <p class="title">Código de verificación</p>

      <div class="code-box">
        <div class="code">${code}</div>
      </div>

      <p class="expiry">
        Este código es válido por <strong>5 minutos</strong>.<br/>
        Solo puede usarse <strong>una vez</strong>.
      </p>

      <div class="divider"></div>

      <p class="warning">
        <strong>¿No solicitaste este código?</strong><br/>
        Ignora este mensaje. Tu cuenta permanece segura.
        Si crees que alguien intentó acceder, cambia tu contraseña de inmediato.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} Banco Digital · Este es un mensaje automático, no respondas a este correo.
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
