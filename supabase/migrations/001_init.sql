-- Supabase Migration: 001_init.sql
-- LicenseShield AI: Profiles, API Keys, and Audit Logs

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access to profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow individual update access to profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT DEFAULT 'Default API Key',
  monthly_limit INTEGER DEFAULT 100,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow user to delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Index on key_hash for O(1) auth lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys (key_hash);

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  audit_id TEXT UNIQUE NOT NULL,
  billed_via TEXT NOT NULL, -- 'STRIPE_SUBSCRIPTION' | 'BASE_SEPOLIA_USDC'
  target_license TEXT DEFAULT 'MIT',
  packages_scanned JSONB NOT NULL,
  report_output JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Index on audit_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_audit_id ON public.audit_logs (audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
