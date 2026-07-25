import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../shared/config/env';

/**
 * Cliente de Supabase para operaciones del servidor.
 *
 * Usa la SERVICE_ROLE_KEY para tener acceso completo a la base de datos
 * y bypass de las políticas RLS (Row Level Security).
 *
 * IMPORTANTE: Nunca exponer esta key al frontend.
 * Todo acceso a Supabase desde el backend usa esta instancia.
 */
const supabaseClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export default supabaseClient;
