-- Migration: Add 'pending_verification' to payment_status_enum
-- Required for digital wallet payment verification flow

ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'pending_verification' BEFORE 'paid';
