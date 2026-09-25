-- FastOrder League: Gamification & Leaderboard System
-- Migration: 0005_add_league_tables.sql

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE league_season_status_enum AS ENUM ('upcoming', 'active', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE league_point_reason_enum AS ENUM ('tier_1', 'tier_2', 'tier_3', 'first_order', 'reversal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. League Seasons
CREATE TABLE IF NOT EXISTS league_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status league_season_status_enum NOT NULL DEFAULT 'upcoming',
  tier1_max_piasters INTEGER NOT NULL DEFAULT 10000,
  tier2_max_piasters INTEGER NOT NULL DEFAULT 20000,
  first_order_points INTEGER NOT NULL DEFAULT 5,
  min_orders_for_prize INTEGER NOT NULL DEFAULT 5,
  max_points_orders_per_day INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_seasons_status ON league_seasons (status);
CREATE INDEX IF NOT EXISTS idx_league_seasons_ends_at ON league_seasons (ends_at);

-- 3. League Points Log (Auditable — every point award is its own row)
CREATE TABLE IF NOT EXISTS league_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason league_point_reason_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_points_student_season ON league_points_log (student_id, season_id);
CREATE INDEX IF NOT EXISTS idx_league_points_order ON league_points_log (order_id);
CREATE INDEX IF NOT EXISTS idx_league_points_season ON league_points_log (season_id);

-- 4. League Standings (Incrementally Maintained)
CREATE TABLE IF NOT EXISTS league_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  last_point_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_league_standings_student_season ON league_standings (student_id, season_id);
CREATE INDEX IF NOT EXISTS idx_league_standings_season_rank ON league_standings (season_id, total_points);

-- 5. League Prizes
CREATE TABLE IF NOT EXISTS league_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  description TEXT NOT NULL,
  sponsor_kiosk_id UUID REFERENCES kiosks(id) ON DELETE SET NULL,
  claimed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_prizes_season_rank ON league_prizes (season_id, rank);
