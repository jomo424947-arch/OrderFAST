-- FastOrder: Student Feedback & Complaints (Support Tickets) Table
-- Migration: 0010_add_support_tickets.sql

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'other',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  
  -- Student / Submitter Information
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  university TEXT DEFAULT 'sphinx',
  college TEXT,

  -- Related references
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  kiosk_id UUID REFERENCES kiosks(id) ON DELETE SET NULL,
  kiosk_name TEXT,

  -- Status & Management
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  admin_notes TEXT,
  admin_reply TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets (category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_num ON support_tickets (ticket_number);
