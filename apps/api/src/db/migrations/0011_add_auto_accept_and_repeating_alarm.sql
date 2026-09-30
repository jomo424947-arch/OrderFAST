-- Migration: 0011_add_auto_accept_and_repeating_alarm.sql
-- Description: Add auto-accept orders toggle and 10s repeating chime toggle for cashiers during peak hours

ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS auto_accept_orders BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS repeating_chime_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN kiosks.auto_accept_orders IS 'When enabled, incoming orders are automatically accepted and moved to kitchen queue without cashier manual confirmation';
COMMENT ON COLUMN kiosks.repeating_chime_enabled IS 'When enabled, new order chime plays repeatedly for 10 seconds on cashier screen until dismissed';
