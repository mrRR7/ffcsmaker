-- Security hardening: share_timetables and share_links were both readable
-- and writable by anyone holding the public anon key (RLS policies below
-- used `USING (true)` / `WITH CHECK (true)`), directly from a browser
-- console, completely bypassing the app's own payload-size checks.
--
-- Neither table is actually touched via the anon/browser client anywhere in
-- the app:
--   - share_timetables is only read/written via the service-role admin
--     client (src/app/api/share-timetable/route.ts,
--     src/app/timetable/[id]/page.tsx), which bypasses RLS entirely.
--   - share_links is unused by the app at all (superseded by
--     share_timetables). Consider dropping the table outright once you've
--     confirmed nothing external depends on it.
--
-- So removing these public policies changes nothing for the app itself,
-- while closing the direct-write/read hole.

DROP POLICY IF EXISTS "share_timetables_public_read" ON share_timetables;
DROP POLICY IF EXISTS "share_timetables_insert" ON share_timetables;

DROP POLICY IF EXISTS "share_public_read" ON share_links;
DROP POLICY IF EXISTS "share_insert" ON share_links;

-- Defense-in-depth size caps at the DB level. The app already enforces
-- smaller limits (1MB / 2MB) in code; these just guard against that check
-- ever being bypassed, removed, or forgotten by a future change — they are
-- deliberately looser than the app-level limits.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'share_timetables_snapshot_size_check'
  ) THEN
    ALTER TABLE share_timetables
      ADD CONSTRAINT share_timetables_snapshot_size_check
      CHECK (length(snapshot_json::text) < 1200000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vtop_imports_payload_size_check'
  ) THEN
    ALTER TABLE vtop_imports
      ADD CONSTRAINT vtop_imports_payload_size_check
      CHECK (length(payload_json::text) < 2200000);
  END IF;
END $$;
