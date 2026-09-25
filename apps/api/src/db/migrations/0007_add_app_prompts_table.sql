-- FastOrder: Dynamic In-App Motivational Prompts & Promotional Ads
-- Migration: 0007_add_app_prompts_table.sql

CREATE TABLE IF NOT EXISTS app_prompts (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  mode TEXT NOT NULL DEFAULT 'auto',
  title TEXT NOT NULL DEFAULT 'جدد طاقتك الجامعية',
  message TEXT NOT NULL DEFAULT 'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.',
  subtext TEXT NOT NULL DEFAULT 'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.',
  icon TEXT NOT NULL DEFAULT 'zap',
  image_url TEXT,
  badge_text TEXT DEFAULT 'عرض خاص',
  layout_mode TEXT NOT NULL DEFAULT 'smart_fit',
  action_text TEXT NOT NULL DEFAULT 'تصفح الأكشاك واطلب الآن',
  action_url TEXT NOT NULL DEFAULT '/student/kiosks',
  duration_seconds INTEGER NOT NULL DEFAULT 10,
  frequency_hours INTEGER NOT NULL DEFAULT 4,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was already created
ALTER TABLE app_prompts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE app_prompts ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'عرض خاص';
ALTER TABLE app_prompts ADD COLUMN IF NOT EXISTS layout_mode TEXT NOT NULL DEFAULT 'smart_fit';

-- Seed inaugural default row
INSERT INTO app_prompts (
  id,
  is_enabled,
  mode,
  title,
  message,
  subtext,
  icon,
  image_url,
  badge_text,
  action_text,
  action_url,
  duration_seconds,
  frequency_hours
) VALUES (
  'default',
  true,
  'auto',
  'جدد طاقتك الجامعية',
  'يومك طويل في الكلية؟ اطلب مشروبك المفضل أو سناك خفيف بضغطة واحدة.',
  'استلم بالرقم من الكشك مباشرة وادفع كاش أو بمحفظتك الإلكترونية.',
  'zap',
  NULL,
  'عرض خاص',
  'تصفح الأكشاك واطلب الآن',
  '/student/kiosks',
  10,
  4
) ON CONFLICT (id) DO NOTHING;
