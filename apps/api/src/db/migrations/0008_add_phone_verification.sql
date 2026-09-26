-- Migration 0008: Add phone verification fields to profiles table
-- Required for OTP phone verification feature (cash-on-delivery orders)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Create index for quick phone verification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON profiles (phone_verified) WHERE phone_verified = true;
