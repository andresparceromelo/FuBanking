-- Migration: Add admin role to users and CREDITO account type
-- Run this in Supabase SQL Editor

-- 1. Add role column to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Add CREDITO to accounts if there's a check constraint on account_type
-- First, check if there's a check constraint and drop it
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'accounts'
    AND tc.constraint_type = 'CHECK'
    AND ccu.column_name = 'account_type'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.accounts DROP CONSTRAINT %I', constraint_name);
    EXECUTE format('ALTER TABLE public.accounts ADD CONSTRAINT %s CHECK (account_type IN (''AHORROS'', ''CORRIENTE'', ''NOMINA'', ''CREDITO''))', constraint_name);
  END IF;
END $$;

-- If no check constraint exists, the enum/type is handled by the app.
-- We just need to make sure the app knows about CREDITO.

-- 3. Create a default admin user (change the email to yours)
-- IMPORTANT: Replace 'admin@fubank.com' with your actual email
-- This user must already exist in auth.users (have signed up)
-- This just sets their role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@fubank.com';

-- If the user doesn't exist yet, you can assign the role later:
-- UPDATE public.users SET role = 'admin' WHERE email = 'tu_email@example.com';
