import { Campus, SlotVariant } from "@/engine/types";
import { DBCourse } from "@/types/db";

interface CacheEntry {
  data: DBCourse[];
  timestamp: number;
  semesterId: string | null;
  slotVariant: SlotVariant | null;
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(query: string, campus: Campus, semesterId?: string) {
  return `${campus}::${semesterId ?? "active"}::${query.toLowerCase().trim()}`;
}

export function getCached(
  query: string,
  campus: Campus,
  semesterId?: string
): CacheEntry | null {
  const key = cacheKey(query, campus, semesterId);
  const entry = queryCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }
  return entry;
}

export function setCache(
  query: string,
  campus: Campus,
  data: DBCourse[],
  semesterId: string | null,
  slotVariant: SlotVariant | null,
  requestedSemesterId?: string
) {
  queryCache.set(cacheKey(query, campus, requestedSemesterId), {
    data,
    timestamp: Date.now(),
    semesterId,
    slotVariant
  });
}

export function clearCampusCache(campus: Campus) {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${campus}::`)) {
      queryCache.delete(key);
    }
  }
}

export function clearAllCache() {
  queryCache.clear();
}

export async function prewarmCatalogCache(campus: Campus) {
  if (getCached("", campus)) {
    return;
  }

  try {
    const response = await fetch(`/api/catalog/search?q=&campus=${campus}`);
    if (!response.ok) {
      return;
    }
    const json = (await response.json()) as {
      courses?: DBCourse[];
      semesterId?: string | null;
      slotVariant?: SlotVariant | null;
    };
    setCache("", campus, json.courses ?? [], json.semesterId ?? null, json.slotVariant ?? null);
  } catch {
    // Best effort only. Normal search still works without a warm cache.
  }
}
