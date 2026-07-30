-- Migration: Create loan_applications table
-- Run this in Supabase SQL Editor

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON public.loan_applications(created_at DESC);
