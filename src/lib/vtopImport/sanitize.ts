import type {
  PlannerImportJSON,
  VtopCourse,
  VtopCourseOption
} from "@/features/vtop-scraper/types";

const LIMITS = { courses: 1500, options: 300, slots: 12 };
const SLOT_RE = /^[A-Za-z0-9+]{1,40}$/;

function str(value: unknown, max = 200): string | null {
  return typeof value === "string" && value.length <= max ? value : null;
}

function credits(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 30
    ? value
    : null;
}

function slots(value: unknown): string[] | null {
  return Array.isArray(value) &&
    value.length <= LIMITS.slots &&
    value.every((slot) => typeof slot === "string" && SLOT_RE.test(slot))
    ? (value as string[])
    : null;
}

function option(value: unknown): VtopCourseOption | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const professorName = str(o.professorName);
  const theorySlots = slots(o.theorySlots);
  const labSlots = slots(o.labSlots);
  const optionCredits = credits(o.credits);
  const program = o.program == null ? null : str(o.program, 40);
  const notes = str(o.notes ?? "", 500);
  if (
    professorName === null ||
    theorySlots === null ||
    labSlots === null ||
    optionCredits === null ||
    (o.program != null && program === null) ||
    notes === null
  ) {
    return null;
  }
  return { professorName, theorySlots, labSlots, credits: optionCredits, program, notes };
}

function course(value: unknown): VtopCourse | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Record<string, unknown>;
  const courseCode = str(c.courseCode, 20);
  const courseName = str(c.courseName);
  const courseCredits = credits(c.credits);
  if (
    courseCode === null ||
    courseName === null ||
    courseCredits === null ||
    !Array.isArray(c.options) ||
    c.options.length > LIMITS.options
  ) {
    return null;
  }
  const options = c.options.map(option);
  if (options.some((o) => o === null)) return null;
  return { courseCode, courseName, credits: courseCredits, options: options as VtopCourseOption[] };
}

/**
 * Rebuilds the import from known fields only, so the stored row (later handed
 * to whoever opens the token link) never carries arbitrary attacker JSON.
 * Returns null if any field is malformed or over its limit.
 */
export function sanitizeImport(body: unknown): PlannerImportJSON | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.courses) || b.courses.length > LIMITS.courses) return null;

  const courses = b.courses.map(course);
  if (courses.some((c) => c === null)) return null;
  const valid = courses as VtopCourse[];

  const professors = new Set(valid.flatMap((c) => c.options.map((o) => o.professorName)));
  const source = b.source === "dom" || b.source === "network" || b.source === "mixed" ? b.source : undefined;

  return {
    campus: str(b.campus, 20) ?? "unknown",
    semesterLabel: str(b.semesterLabel) ?? "",
    courses: valid,
    slots: [],
    faculty: Array.from(professors, (name) => ({ name })),
    capturedAt: str(b.capturedAt, 40) ?? new Date().toISOString(),
    source
  };
}
