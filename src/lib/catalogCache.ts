import { Campus, SlotVariant } from "@/engine/types";
import { DBCourse } from "@/types/db";

interface CatalogCacheEntry {
  courses: DBCourse[];
  semesterId: string | null;
  slotVariant: SlotVariant | null;
  timestamp: number;
}

// Catalogs are small (a single campus/semester today) and change rarely, so
// the whole thing is fetched once and cached here, then every search filters
// this in-memory list instead of hitting the network per keystroke.
const catalogCache = new Map<string, CatalogCacheEntry>();
const inFlight = new Map<string, Promise<CatalogCacheEntry>>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function catalogCacheKey(campus: Campus, semesterId: string) {
  return `${campus}::${semesterId}`;
}

function getFresh(key: string): CatalogCacheEntry | null {
  const entry = catalogCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    catalogCache.delete(key);
    return null;
  }
  return entry;
}

/** Returns the cached full catalog for a campus+semester, if present and fresh. */
export function getCachedCatalog(
  campus: Campus,
  semesterId: string
): CatalogCacheEntry | null {
  return getFresh(catalogCacheKey(campus, semesterId));
}

/**
 * Loads the full catalog for a campus (optionally a specific semester),
 * using the cache when possible and de-duplicating concurrent requests for
 * the same campus+semester. Callers filter the returned course list
 * themselves rather than asking the server to filter per query.
 */
export async function loadCatalog(
  campus: Campus,
  semesterId?: string
): Promise<CatalogCacheEntry> {
  if (semesterId) {
    const cached = getCachedCatalog(campus, semesterId);
    if (cached) {
      return cached;
    }
  }

  const requestKey = `${campus}::${semesterId ?? "auto"}`;
  const pending = inFlight.get(requestKey);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const params = new URLSearchParams({ campus });
    if (semesterId) {
      params.set("semester", semesterId);
    }
    const response = await fetch(`/api/catalog/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Catalog unavailable.");
    }
    const json = (await response.json()) as {
      courses?: DBCourse[];
      semesterId?: string | null;
      slotVariant?: SlotVariant | null;
    };
    const entry: CatalogCacheEntry = {
      courses: json.courses ?? [],
      semesterId: json.semesterId ?? null,
      slotVariant: json.slotVariant ?? null,
      timestamp: Date.now()
    };
    if (entry.semesterId) {
      catalogCache.set(catalogCacheKey(campus, entry.semesterId), entry);
    }
    return entry;
  })();

  inFlight.set(requestKey, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(requestKey);
  }
}

export function clearCampusCache(campus: Campus) {
  for (const key of catalogCache.keys()) {
    if (key.startsWith(`${campus}::`)) {
      catalogCache.delete(key);
    }
  }
}

export function clearAllCache() {
  catalogCache.clear();
}
