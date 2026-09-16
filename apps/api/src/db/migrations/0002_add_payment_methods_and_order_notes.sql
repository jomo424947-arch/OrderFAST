-- 0002_add_payment_methods_and_order_notes.sql

-- 1. Add Payment Configuration to Kiosks Table
ALTER TABLE kiosks
  ADD COLUMN IF NOT EXISTS accepts_cash BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_online BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_policy TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS wallet_number TEXT,
  ADD COLUMN IF NOT EXISTS instapay_handle TEXT,
  ADD COLUMN IF NOT EXISTS accepts_wallet BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_instapay BOOLEAN NOT NULL DEFAULT true;

-- 2. Add Order Notes and Online Payment Proof to Orders Table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_notes TEXT,
  ADD COLUMN IF NOT EXISTS online_payment_type TEXT,
  ADD COLUMN IF NOT EXISTS transfer_sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS transfer_amount INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_image_url TEXT;

-- 3. Add Index for Fast Querying by Payment Method and Kiosk
CREATE INDEX IF NOT EXISTS idx_orders_kiosk_payment ON orders(kiosk_id, payment_method, status);
