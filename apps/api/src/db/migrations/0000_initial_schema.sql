-- ====================================================================
-- OrderFAST Migration 0000: Initial Architecture Schema (Revision V2)
-- ====================================================================

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE system_role_enum AS ENUM ('student', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM ('active', 'warning', 'restricted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kiosk_role_enum AS ENUM ('owner', 'cashier');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM (
        'PENDING_KIOSK',
        'ACCEPTED',
        'PREPARING',
        'READY',
        'COMPLETED',
        'REJECTED',
        'EXPIRED',
        'CANCELLED',
        'NO_SHOW'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cash', 'digital_wallet');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending_at_pickup', 'paid', 'waived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM ('order_status', 'kiosk_notice', 'system', 'warning');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE actor_type_enum AS ENUM ('student', 'staff', 'admin', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Profiles Table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    system_role system_role_enum NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    university_id TEXT UNIQUE NOT NULL,
    college TEXT NOT NULL,
    account_status account_status_enum NOT NULL DEFAULT 'active',
    no_show_count INTEGER NOT NULL DEFAULT 0 CHECK (no_show_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Kiosks Table
CREATE TABLE IF NOT EXISTS kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    college_location TEXT NOT NULL,
    campus_zone TEXT,
    category TEXT NOT NULL DEFAULT 'عام',
    is_open BOOLEAN NOT NULL DEFAULT false,
    accepts_online_orders BOOLEAN NOT NULL DEFAULT true,
    is_rush_mode BOOLEAN NOT NULL DEFAULT false,
    opening_hours TEXT NOT NULL DEFAULT '8:00 ص - 4:00 م',
    phone TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    default_prep_time_mins INTEGER NOT NULL DEFAULT 15 CHECK (default_prep_time_mins > 0),
    acceptance_timeout_secs INTEGER NOT NULL DEFAULT 300 CHECK (acceptance_timeout_secs >= 60),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Kiosk Staff Table
CREATE TABLE IF NOT EXISTS kiosk_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role kiosk_role_enum NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT idx_kiosk_staff_unique UNIQUE (kiosk_id, user_id)
);

-- 7. Kiosk Daily Counters
CREATE TABLE IF NOT EXISTS kiosk_daily_counters (
    kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_number INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (kiosk_id, counter_date)
);

-- 8. Menu Categories Table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_id UUID NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL CHECK (price > 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_under_review BOOLEAN NOT NULL DEFAULT true,
    preparation_time_mins INTEGER NOT NULL DEFAULT 5 CHECK (preparation_time_mins > 0),
    image_url TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id UUID NOT NULL REFERENCES profiles(id),
    kiosk_id UUID NOT NULL REFERENCES kiosks(id),
    status order_status_enum NOT NULL DEFAULT 'PENDING_KIOSK',
    idempotency_key UUID UNIQUE NOT NULL,
    
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
    fees INTEGER NOT NULL DEFAULT 0 CHECK (fees >= 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    payment_method payment_method_enum NOT NULL DEFAULT 'cash',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending_at_pickup',
    
    rejection_reason TEXT,
    cancellation_reason TEXT,
    orders_ahead_snapshot INTEGER NOT NULL DEFAULT 0,
    student_name_snapshot TEXT NOT NULL,
    student_college_snapshot TEXT NOT NULL,
    kiosk_name_snapshot TEXT NOT NULL,
    
    expires_at TIMESTAMPTZ NOT NULL,
    estimated_ready_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    no_show_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT check_order_total_calc CHECK (total = subtotal - discount + fees),
    CONSTRAINT idx_orders_kiosk_daily_num UNIQUE (kiosk_id, order_date, order_number)
);

-- 11. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    name_snapshot TEXT NOT NULL,
    unit_price_snapshot INTEGER NOT NULL CHECK (unit_price_snapshot > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total INTEGER NOT NULL CHECK (line_total > 0),
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_line_total_calc CHECK (line_total = unit_price_snapshot * quantity)
);

-- 12. Order Events Table
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_status order_status_enum,
    to_status order_status_enum,
    actor_id UUID REFERENCES profiles(id),
    actor_type actor_type_enum NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_orders_kiosk_active 
ON orders (kiosk_id, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_orders_kiosk_incoming 
ON orders (kiosk_id, created_at ASC) 
WHERE status = 'PENDING_KIOSK';

CREATE INDEX IF NOT EXISTS idx_orders_student_history 
ON orders (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_pending_expiry 
ON orders (expires_at) 
WHERE status = 'PENDING_KIOSK';

CREATE INDEX IF NOT EXISTS idx_orders_kiosk_active_queue 
ON orders (kiosk_id, created_at) 
WHERE status IN ('ACCEPTED', 'PREPARING');

CREATE INDEX IF NOT EXISTS idx_menu_items_student_browse 
ON menu_items (kiosk_id, category_id) 
WHERE is_deleted = false AND is_available = true AND is_under_review = false;

CREATE INDEX IF NOT EXISTS idx_menu_items_under_review 
ON menu_items (created_at ASC) 
WHERE is_under_review = true AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications (user_id, created_at DESC) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id 
ON order_events (order_id, created_at);
