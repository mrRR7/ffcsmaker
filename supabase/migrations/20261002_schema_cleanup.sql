-- Schema cleanup. Also brings production in line with two earlier
-- migrations that were never applied there:
--   20260905_lock_down_share_writes.sql (share tables were anon-writable)
--   20260626_vtop_imports.sql           (table missing, VTOP import 500s)

-- 1. Lock down share_timetables: only the service-role client touches it.
DROP POLICY IF EXISTS "share_timetables_public_read" ON share_timetables;
DROP POLICY IF EXISTS "share_timetables_insert" ON share_timetables;

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

-- 2. share_links: never used by the app (superseded by share_timetables).
DROP TABLE IF EXISTS share_links;

-- 3. vtop_imports: short-lived VTOP import handoff (src/lib/vtopImport/storage.ts).
CREATE TABLE IF NOT EXISTS vtop_imports (
  id TEXT PRIMARY KEY,
  payload_json JSONB NOT NULL,
  campus TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vtop_imports_payload_size_check CHECK (length(payload_json::text) < 2200000)
);

CREATE INDEX IF NOT EXISTS vtop_imports_expires_at_idx ON vtop_imports (expires_at);
ALTER TABLE vtop_imports ENABLE ROW LEVEL SECURITY; -- no policies: service role only

-- Imports are deleted when consumed; this sweeps the ones nobody opened.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'purge-expired-vtop-imports',
  '0 3 * * *',
  $$DELETE FROM public.vtop_imports WHERE expires_at < now()$$
);

-- 4. course_options: one row per professor/slot/program per course.
DELETE FROM course_options o
USING course_options keep
WHERE o.course_id = keep.course_id
  AND o.professor_name = keep.professor_name
  AND o.theory_slots = keep.theory_slots
  AND o.lab_slots = keep.lab_slots
  AND o.program IS NOT DISTINCT FROM keep.program
  AND (o.created_at, o.id) > (keep.created_at, keep.id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_options_unique') THEN
    ALTER TABLE course_options
      ADD CONSTRAINT course_options_unique
      UNIQUE NULLS NOT DISTINCT (course_id, professor_name, theory_slots, lab_slots, program);
  END IF;
END $$;

-- 5. Indexes already covered by a multi-column index with the same leading column.
DROP INDEX IF EXISTS courses_semester_idx;        -- courses_semester_id_course_code_key
DROP INDEX IF EXISTS semesters_campus_idx;        -- semesters_campus_active_idx
DROP INDEX IF EXISTS options_course_idx;          -- course_options_course_program_idx / course_options_unique
DROP INDEX IF EXISTS course_options_program_idx;  -- program is never filtered without course_id
