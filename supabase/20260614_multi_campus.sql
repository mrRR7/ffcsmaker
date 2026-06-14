ALTER TABLE semesters
  ADD COLUMN IF NOT EXISTS campus TEXT NOT NULL DEFAULT 'chennai'
    CHECK (campus IN ('chennai', 'vellore', 'bhopal', 'ap')),
  ADD COLUMN IF NOT EXISTS slot_variant TEXT NOT NULL DEFAULT 'standard'
    CHECK (slot_variant IN ('standard', 'bhopal', 'ap'));

UPDATE semesters
SET campus = 'chennai',
    slot_variant = 'standard'
WHERE campus IS NULL
   OR slot_variant IS NULL;

ALTER TABLE semesters
  DROP CONSTRAINT IF EXISTS semesters_label_key;

ALTER TABLE semesters
  ADD CONSTRAINT semesters_label_campus_key UNIQUE (label, campus);

DROP INDEX IF EXISTS semesters_one_active;

CREATE UNIQUE INDEX IF NOT EXISTS semesters_one_active_per_campus
  ON semesters (campus)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS semesters_campus_idx ON semesters(campus);
CREATE INDEX IF NOT EXISTS semesters_campus_active_idx ON semesters(campus, is_active);
