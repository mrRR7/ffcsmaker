-- Performance: the catalog search route (src/app/api/catalog/search/route.ts)
-- filters with ILIKE ('course_code ILIKE code%' / 'course_name ILIKE %name%'),
-- but courses_search_idx was a GIN index over to_tsvector(...) — a
-- full-text-search index that Postgres cannot use to accelerate ILIKE at
-- all. It's been dead weight on every course write with zero read benefit,
-- and the '%name%' half of the query (leading wildcard) has never been able
-- to use any index, falling back to a sequential scan.
--
-- pg_trgm trigram indexes are what actually speed up ILIKE prefix and
-- substring matches, so this swaps the unused tsvector index for those.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS courses_search_idx;

CREATE INDEX IF NOT EXISTS courses_code_trgm_idx
  ON courses USING gin (course_code gin_trgm_ops);

CREATE INDEX IF NOT EXISTS courses_name_trgm_idx
  ON courses USING gin (course_name gin_trgm_ops);
