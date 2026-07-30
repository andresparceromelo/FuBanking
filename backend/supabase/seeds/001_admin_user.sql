-- =============================================
-- SEED: Crear usuario admin para pruebas
-- Ejecutar en Supabase SQL DESPUÉS de la migración 202607300001
-- =============================================

-- 1. Asegurar que la columna role existe (por si acaso)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- 2. Insertar usuario admin
-- Email:    admin@fubanking.com
-- Password: Admin123!
-- Document: 1234567890
INSERT INTO public.users (
  id,
  first_name,
  middle_name,
  last_name,
  second_last_name,
  birth_date,
  email,
  document,
  phone,
  password,
  is_active,
  two_factor_enabled,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Admin',
  NULL,
  'FuBanking',
  NULL,
  '1990-01-01',
  'admin@fubanking.com',
  '1234567890',
  '+573001234567',
  '$2b$10$Kp.Ex62pAH31n7Z0p/AYNe88Z9sJ8JarSl.4TqXj6Wuyhv0Nu8tom',
  true,
  false,
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Verificar
SELECT id, first_name, last_name, email, role
FROM public.users
WHERE email = 'admin@fubanking.com';
