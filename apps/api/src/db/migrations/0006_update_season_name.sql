-- Migration: 0006_update_season_name.sql
UPDATE league_seasons
SET name = 'الموسم الأول 2026'
WHERE name = 'الموسم الافتتاحي 2026';
