-- Supabase Migration: 002_auto_provision.sql
-- Automatic Profile Creation and Default API Key Provisioning on User Sign-Up

-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_key_secret TEXT;
  raw_api_key TEXT;
  hashed_key TEXT;
  key_prefix_val TEXT;
BEGIN
  -- 1. Insert Profile row
  INSERT INTO public.profiles (id, email, plan_tier, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Generate random secret for default API key (ls_live_...)
  raw_key_secret := encode(gen_random_bytes(16), 'hex');
  raw_api_key := 'ls_live_' || raw_key_secret;
  
  -- SHA-256 hash using pgcrypto digest
  hashed_key := encode(digest(raw_api_key, 'sha256'), 'hex');
  key_prefix_val := substring(raw_api_key from 1 for 12);

  -- 3. Insert default API key with 100-scan monthly limit
  INSERT INTO public.api_keys (
    user_id,
    key_hash,
    key_prefix,
    name,
    monthly_limit,
    usage_count,
    is_active
  )
  VALUES (
    NEW.id,
    hashed_key,
    key_prefix_val,
    'Default API Key',
    100,
    0,
    TRUE
  )
  ON CONFLICT (key_hash) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger listening on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
