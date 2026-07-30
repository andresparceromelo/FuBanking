-- Migration: Create money_requests table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_money_requests_requester ON public.money_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_requested ON public.money_requests(requested_user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_money_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_money_requests_updated_at ON public.money_requests;
CREATE TRIGGER set_money_requests_updated_at
  BEFORE UPDATE ON public.money_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_money_requests_updated_at();

-- Enable RLS
ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend uses service_role key)
CREATE POLICY "Service role full access money_requests"
  ON public.money_requests FOR ALL
  USING (true)
  WITH CHECK (true);
