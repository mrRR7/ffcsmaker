// Anonymous product events. Shared by the client sender and /api/events.
// Each prop is either a fixed set of strings or a non-negative integer.
// Nothing here may identify a person: no ids, names, course codes or free text.

type PropSpec = readonly string[] | "int";

export const USAGE_EVENTS = {
  course_added: { source: ["catalog", "paste", "file", "manual", "vtop"] },
  generate_started: { courses: "int" },
  generate_completed: { weeks: ["0", "1-10", "11-50", "50+"], ms: "int" },
  generate_zero: { courses: "int" },
  slot_list_copied: {},
  share_link_created: {},
  share_image_saved: {},
  ical_exported: {},
  timetable_saved: {},
  vtop_import_used: {},
  donate_banner_clicked: {},
  support_page_viewed: {}
} as const satisfies Record<string, Record<string, PropSpec>>;

export type UsageEventName = keyof typeof USAGE_EVENTS;

const CAMPUSES = ["chennai", "vellore", "bhopal", "ap"];
const MAX_INT = 10_000_000;

export function weeksBucket(count: number) {
  if (count === 0) return "0";
  if (count <= 10) return "1-10";
  if (count <= 50) return "11-50";
  return "50+";
}

/** Returns a clean row, or null when the event name isn't allowlisted. Unknown or invalid props are dropped. */
export function sanitizeUsageEvent(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { name, campus, props } = input as Record<string, unknown>;
  if (typeof name !== "string" || !Object.hasOwn(USAGE_EVENTS, name)) return null;

  const spec = USAGE_EVENTS[name as UsageEventName] as Record<string, PropSpec>;
  const raw = props && typeof props === "object" ? (props as Record<string, unknown>) : {};
  const clean: Record<string, string | number> = {};
  for (const [key, allowed] of Object.entries(spec)) {
    const value = raw[key];
    if (allowed === "int") {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        clean[key] = Math.min(Math.round(value), MAX_INT);
      }
    } else if (typeof value === "string" && allowed.includes(value)) {
      clean[key] = value;
    }
  }

  return {
    name,
    campus: typeof campus === "string" && CAMPUSES.includes(campus) ? campus : null,
    props: clean
  };
}
