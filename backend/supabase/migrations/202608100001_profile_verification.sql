-- Migration: Profile verification fields (document, income) + birth_date as DATE
-- Run this in Supabase SQL Editor

-- 1. Nuevos campos de verificacion en users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS document_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_verified_at TIMESTAMPTZ;

-- 2. Fix bug de fecha de nacimiento: pasar de timestamptz a DATE (sin zona horaria)
ALTER TABLE public.users
  ALTER COLUMN birth_date TYPE DATE USING birth_date::date;

-- 3. Bucket de Storage para documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, 2097152, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 4. Politica de lectura publica para el bucket documents
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');
