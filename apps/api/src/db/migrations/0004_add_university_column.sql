-- Migration: Add university_enum and university column to students and kiosks
-- Required for multi-university authorization (Sphinx and Assiut Ahleya)

-- 1. Create university enum if it does not exist
DO $$ BEGIN
    CREATE TYPE university_enum AS ENUM ('sphinx', 'assiut_ahleya');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add university column to students table (default 'sphinx')
ALTER TABLE students ADD COLUMN IF NOT EXISTS university university_enum NOT NULL DEFAULT 'sphinx';

-- 3. Add university column to kiosks table (default 'sphinx')
ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS university university_enum NOT NULL DEFAULT 'sphinx';

-- 4. Create indexes on university column for performance
CREATE INDEX IF NOT EXISTS idx_students_university ON students (university);
CREATE INDEX IF NOT EXISTS idx_kiosks_university ON kiosks (university);
