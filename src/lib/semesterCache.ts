// Minimal in-memory cache for semester lookups.
//
// Semester rows (label, slot_variant, is_active) change at most a few times
// a year, so a warm serverless instance can skip the semesters round trip on
// repeat catalog requests. Per-instance and reset on cold start, like
// rateLimit.ts; a 5-minute staleness window on semester metadata is harmless.
//
// Only real rows are cached. Caching misses would let arbitrary ?semester=
// values fill the map; caching hits keeps it bounded by actual semesters.

import { Campus } from "@/engine/types";
import { DBSemester } from "@/types/db";

interface CacheEntry {
  semester: DBSemester;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

function cacheKey(campus: Campus, semesterId?: string | null) {
  return `${campus}::${semesterId ?? "active"}`;
}

/** Returns the cached semester, or `undefined` on a miss. */
export function getCachedSemester(
  campus: Campus,
  semesterId?: string | null
): DBSemester | undefined {
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
  semester: DBSemester
) {
  cache.set(cacheKey(campus, semesterId), { semester, timestamp: Date.now() });
}
