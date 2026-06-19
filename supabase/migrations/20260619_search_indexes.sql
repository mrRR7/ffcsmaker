-- Ensure pg_trgm extension exists for trigram indexing
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for course_name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_course_name_trgm 
ON courses USING gin (course_name gin_trgm_ops);

-- Create b-tree index for semester_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_semester_id 
ON courses (semester_id);

-- Create partial b-tree index for active semesters by campus
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semesters_active_campus_partial 
ON semesters (campus) WHERE is_active = true;
