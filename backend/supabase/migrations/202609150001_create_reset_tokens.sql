-- Migration: 202609150001_create_reset_tokens.sql
-- Tabla para gestionar tokens de restablecimiento de contraseña.
-- Se almacena el hash SHA-256 del token, nunca el token plano.

CREATE TABLE IF NOT EXISTS reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  TEXT        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por hash del token
CREATE UNIQUE INDEX IF NOT EXISTS reset_tokens_token_hash_idx
  ON reset_tokens (token_hash);

-- Índice para invalidar eficientemente todos los tokens de un usuario
CREATE INDEX IF NOT EXISTS reset_tokens_user_id_idx
  ON reset_tokens (user_id);

-- Comentario de seguridad
COMMENT ON TABLE reset_tokens IS
  'Tokens de restablecimiento de contraseña. Se almacena hash SHA-256, no el token plano.';
