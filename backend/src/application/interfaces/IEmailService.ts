/**
 * Interfaz del servicio de email — capa de Aplicación.
 *
 * Los casos de uso usan esta interfaz para enviar correos
 * sin acoplarse a ningún proveedor concreto (Resend, SendGrid, etc.).
 *
 * Principio de Inversión de Dependencias (SOLID - D).
 */
export interface IEmailService {
  /**
   * Envía un código de autenticación de dos factores al correo indicado.
   * @param email Correo destino del usuario.
   * @param code Código OTP en texto plano (6 dígitos).
   */
  sendTwoFactorCode(email: string, code: string): Promise<void>;
}
