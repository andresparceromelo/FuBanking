import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Schema de validación para las variables de entorno.
 * Si alguna variable requerida falta o tiene formato incorrecto,
 * la aplicación lanzará un error al arrancar.
 */
const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  /** Expiración del token temporal generado en el primer paso del flujo 2FA. */
  TWO_FACTOR_TOKEN_EXPIRES_IN: z.string().default('10m'),

  /** Rate limiting del endpoint POST /auth/2fa/resend. */
  /** Número máximo de reenvíos por ventana de tiempo. */
  RESEND_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(3),
  /** Duración de la ventana de rate limiting en milisegundos. */
  RESEND_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(600_000),

  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  CLIENT_URL: z.string().default('http://localhost:3000'),

  GMAIL_USSER: z.string().email('GMAIL_USSER must be a valid email'),
  GMAIL_PASS: z.string().min(1, 'GMAIL_PASS is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
