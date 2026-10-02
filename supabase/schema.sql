CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  campus TEXT NOT NULL DEFAULT 'chennai'
    CHECK (campus IN ('chennai', 'vellore', 'bhopal', 'ap')),
  slot_variant TEXT NOT NULL DEFAULT 'standard'
    CHECK (slot_variant IN ('standard', 'bhopal', 'ap')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  end_date DATE,
  ffcs_opens TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(label, campus)
);

DROP INDEX IF EXISTS semesters_one_active;

CREATE UNIQUE INDEX IF NOT EXISTS semesters_one_active_per_campus
  ON semesters (campus)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS semesters_campus_active_idx ON semesters(campus, is_active);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0 AND credits <= 10),
  course_type TEXT NOT NULL CHECK (course_type IN ('theory', 'lab', 'both')),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(semester_id, course_code)
);

CREATE INDEX IF NOT EXISTS courses_code_idx ON courses(course_code);

-- The catalog search route filters with ILIKE ('code%' / '%name%'), which a
-- tsvector/full-text index cannot accelerate at all. Trigram indexes are
-- what actually speeds up ILIKE prefix and substring matches.
DROP INDEX IF EXISTS courses_search_idx;
CREATE INDEX IF NOT EXISTS courses_code_trgm_idx
  ON courses USING gin (course_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS courses_name_trgm_idx
  ON courses USING gin (course_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS course_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  professor_name TEXT NOT NULL,
  theory_slots TEXT[] NOT NULL DEFAULT '{}',
  lab_slots TEXT[] NOT NULL DEFAULT '{}',
  slot_timing JSONB,
  professor_notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  -- NULL means unclassified / fallback.
  program TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_options_unique
    UNIQUE NULLS NOT DISTINCT (course_id, professor_name, theory_slots, lab_slots, program)
);

CREATE INDEX IF NOT EXISTS course_options_course_program_idx ON course_options(course_id, program);

ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'semesters'
      AND policyname = 'semesters_public_read'
  ) THEN
    CREATE POLICY "semesters_public_read" ON semesters FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'courses'
      AND policyname = 'courses_public_read'
  ) THEN
    CREATE POLICY "courses_public_read" ON courses FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'course_options'
      AND policyname = 'options_public_read'
  ) THEN
    CREATE POLICY "options_public_read" ON course_options FOR SELECT USING (true);
  END IF;

END $$;

-- share_timetables is only ever read/written via the service-role admin
-- client server-side, so it has no public RLS policy letting the anon key
-- touch it from a browser. RLS stays enabled with no policies, which
-- defaults to deny for anon/authenticated roles; the service role bypasses
-- RLS entirely regardless.

CREATE TABLE IF NOT EXISTS share_timetables (
  id TEXT PRIMARY KEY,
  snapshot_json JSONB NOT NULL,
  score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE share_timetables ENABLE ROW LEVEL SECURITY;

-- No public policies: only the service-role admin client reads/writes this
-- table (see the comment above). RLS with zero policies defaults to deny
-- for anon/authenticated roles.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'share_timetables_snapshot_size_check'
  ) THEN
    ALTER TABLE share_timetables
      ADD CONSTRAINT share_timetables_snapshot_size_check
      CHECK (length(snapshot_json::text) < 1200000);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vtop_imports (
  id TEXT PRIMARY KEY,
  payload_json JSONB NOT NULL,
  campus TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vtop_imports_expires_at_idx ON vtop_imports (expires_at);

ALTER TABLE vtop_imports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vtop_imports_payload_size_check'
  ) THEN
    ALTER TABLE vtop_imports
      ADD CONSTRAINT vtop_imports_payload_size_check
      CHECK (length(payload_json::text) < 2200000);
  END IF;
END $$;

-- Imports are deleted when consumed; this sweeps the ones nobody opened.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'purge-expired-vtop-imports',
  '0 3 * * *',
  $$DELETE FROM public.vtop_imports WHERE expires_at < now()$$
);
