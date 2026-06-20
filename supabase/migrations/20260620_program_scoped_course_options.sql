-- program is nullable. NULL means unclassified / fallback.
ALTER TABLE course_options
  ADD COLUMN IF NOT EXISTS program TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS course_options_program_idx ON course_options(program);
CREATE INDEX IF NOT EXISTS course_options_course_program_idx ON course_options(course_id, program);
