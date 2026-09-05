// Minimal in-memory cache for semester lookups.
//
// Semester rows (label, slot_variant, is_active) change at most a few times
// a year, but the catalog search route previously re-queried the semesters
// table on every single request just to resolve/validate the semester. This
// cache lets a warm serverless instance skip that round trip for repeat
// requests within the TTL window. Like rateLimit.ts, it's per-instance and
// resets on cold start — that's fine here since a 5-minute staleness window
// on semester metadata is harmless.

import { Campus } from "@/engine/types";
import { DBSemester } from "@/types/db";

interface CacheEntry {
  semester: DBSemester | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

function cacheKey(campus: Campus, semesterId?: string | null) {
  return `${campus}::${semesterId ?? "active"}`;
}

/** Returns the cached semester, `null` for a cached "not found", or `undefined` on a cache miss. */
export function getCachedSemester(
  campus: Campus,
  semesterId?: string | null
): DBSemester | null | undefined {
  const key = cacheKey(campus, semesterId);
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.semester;
}

export function setCachedSemester(
  campus: Campus,
  semesterId: string | null | undefined,
  semester: DBSemester | null
) {
  cache.set(cacheKey(campus, semesterId), { semester, timestamp: Date.now() });
}

export function clearSemesterCache() {
  cache.clear();
}
