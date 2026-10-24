import { Campus, SlotVariant } from "@/engine/types";
import { DBCourse, DBSemester } from "@/types/db";

interface CatalogCacheEntry {
  courses: DBCourse[];
  semesterId: string | null;
  slotVariant: SlotVariant | null;
}

// Catalogs and semesters change rarely, so each is fetched once per tab and
// shared by every caller: an in-memory promise (parallel callers share one
// request) backed by sessionStorage (a reload doesn't refetch). Every search
// then filters the in-memory course list instead of hitting the network.
// An admin import reaches an open tab within the TTL; ?fresh=1 in the page
// URL skips the stored copy.
const CATALOG_TTL_MS = 15 * 60 * 1000;
const SEMESTERS_TTL_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = "ffcs-cache:";

const memory = new Map<string, { at: number; value: Promise<unknown> }>();

function readStored<T>(key: string, ttlMs: number): { at: number; value: T } | null {
  try {
    if (new URLSearchParams(window.location.search).has("fresh")) return null;
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { at: number; value: T };
    return Date.now() - stored.at < ttlMs ? stored : null;
  } catch {
    return null;
  }
}

function memo<T>(key: string, ttlMs: number, fetcher: () => Promise<T>, persist = true): Promise<T> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;

  const stored = persist ? readStored<T>(key, ttlMs) : null;
  const at = stored?.at ?? Date.now();
  const value = stored
    ? Promise.resolve(stored.value)
    : fetcher().then((result) => {
        if (persist) {
          try {
            sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ at, value: result }));
          } catch {
            // Blocked or full storage: the in-memory copy still serves this tab.
          }
        }
        return result;
      });
  memory.set(key, { at, value });
  // A failed request isn't cached, so the next caller retries.
  value.catch(() => {
    if (memory.get(key)?.value === value) memory.delete(key);
  });
  return value;
}

async function fetchCatalog(campus: Campus, semesterId?: string): Promise<CatalogCacheEntry> {
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
  return {
    courses: json.courses ?? [],
    semesterId: json.semesterId ?? null,
    slotVariant: json.slotVariant ?? null
  };
}

/**
 * Loads the full catalog for a campus (optionally a specific semester).
 * Callers filter the returned course list themselves rather than asking the
 * server to filter per query.
 */
export function loadCatalog(campus: Campus, semesterId?: string): Promise<CatalogCacheEntry> {
  const active = memo(`catalog::${campus}::auto`, CATALOG_TTL_MS, () => fetchCatalog(campus));
  if (!semesterId) {
    return active;
  }
  // Almost always the active semester: reuse that response, and store it only once.
  return memo(
    `catalog::${campus}::${semesterId}`,
    CATALOG_TTL_MS,
    async () => {
      const entry = await active.catch(() => null);
      return entry?.semesterId === semesterId ? entry : fetchCatalog(campus, semesterId);
    },
    false
  );
}

/** All semesters for a campus, newest first. */
export function loadSemesters(campus: Campus): Promise<DBSemester[]> {
  return memo(`semesters::${campus}`, SEMESTERS_TTL_MS, async () => {
    const response = await fetch(`/api/catalog/semesters?campus=${campus}`);
    if (!response.ok) {
      throw new Error("Semesters unavailable.");
    }
    const json = (await response.json()) as { semesters?: DBSemester[] };
    return json.semesters ?? [];
  });
}

function clearWhere(match: (key: string) => boolean) {
  for (const key of memory.keys()) {
    if (match(key)) memory.delete(key);
  }
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX) && match(key.slice(STORAGE_PREFIX.length))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Nothing stored to clear.
  }
}

export function clearCampusCache(campus: Campus) {
  clearWhere((key) => key.split("::")[1] === campus);
}

export function clearAllCache() {
  clearWhere(() => true);
}
