-- =============================================
-- EJECUTAR TODO JUNTO EN SUPABASE SQL EDITOR
-- =============================================

-- 1. Tabla notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TRANSFERENCIA', 'PAGO', 'BOLSILLO', 'SOLICITUD_DINERO', 'SISTEMA')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

CREATE OR REPLACE FUNCTION public.set_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_notifications_updated_at();

-- 2. Tabla loan_applications
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  installments INTEGER NOT NULL,
  annual_rate NUMERIC(5,2) NOT NULL,
  monthly_income NUMERIC(15,2) NOT NULL,
  monthly_payment NUMERIC(15,2) NOT NULL,
  total_to_pay NUMERIC(15,2) NOT NULL,
  total_interest NUMERIC(15,2) NOT NULL,
  document_verified BOOLEAN NOT NULL DEFAULT false,
  age_verified BOOLEAN NOT NULL DEFAULT false,
  income_verified BOOLEAN NOT NULL DEFAULT false,
  credit_history_verified BOOLEAN NOT NULL DEFAULT false,
  eligibility JSONB NOT NULL DEFAULT '{"isEligible": true, "reasons": []}',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON public.loan_applications(created_at DESC);

-- 3. Columna role en users (si no existe)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 4. Asignar admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@fubanking.com';
