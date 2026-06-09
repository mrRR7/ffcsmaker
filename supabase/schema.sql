CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  end_date DATE,
  ffcs_opens TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS semesters_one_active
  ON semesters (is_active)
  WHERE is_active = true;

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

CREATE INDEX IF NOT EXISTS courses_semester_idx ON courses(semester_id);
CREATE INDEX IF NOT EXISTS courses_code_idx ON courses(course_code);
CREATE INDEX IF NOT EXISTS courses_search_idx
  ON courses USING gin(to_tsvector('english', course_code || ' ' || course_name));

CREATE TABLE IF NOT EXISTS course_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  professor_name TEXT NOT NULL,
  theory_slots TEXT[] NOT NULL DEFAULT '{}',
  lab_slots TEXT[] NOT NULL DEFAULT '{}',
  slot_timing JSONB,
  professor_notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS options_course_idx ON course_options(course_id);

CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  view_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS share_links_expiry_idx ON share_links(expires_at);

ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'share_links'
      AND policyname = 'share_public_read'
  ) THEN
    CREATE POLICY "share_public_read"
      ON share_links FOR SELECT USING (expires_at > NOW());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'share_links'
      AND policyname = 'share_insert'
  ) THEN
    CREATE POLICY "share_insert" ON share_links FOR INSERT WITH CHECK (true);
  END IF;
END $$;
