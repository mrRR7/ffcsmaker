import { DBCourse, DBCourseOption } from "@/types/db";

/** Kill switch: NEXT_PUBLIC_PROGRAM_PICKER=off hides the picker and searches every course.
 * Inlined at build time, so flipping it needs a redeploy. */
export const PROGRAM_PICKER_ENABLED = process.env.NEXT_PUBLIC_PROGRAM_PICKER !== "off";

// Friendly names for program codes. A code missing here shows as itself, so a
// newly uploaded program never breaks the list.
export const PROGRAM_NAMES: Record<string, string> = {
  BCE: "B.Tech CSE (Core)"
};

export function programLabel(code: string) {
  return PROGRAM_NAMES[code] ?? code;
}

/** `ALL` (and null, on older data) means the row isn't tagged to any program. */
export function isTagged(program: string | null | undefined): program is string {
  return Boolean(program) && program !== "ALL";
}

/** Programs with at least one option in this catalog, sorted by display name. */
export function catalogPrograms(courses: DBCourse[]) {
  const codes = new Set<string>();
  for (const course of courses) {
    for (const option of course.course_options) {
      if (isTagged(option.program)) codes.add(option.program);
    }
  }
  return [...codes].sort((a, b) => programLabel(a).localeCompare(programLabel(b)));
}

// The same professor and slots often appear under several programs; show them once.
function dedupeOptions(options: DBCourseOption[]) {
  const byKey = new Map<string, { option: DBCourseOption; programs: Set<string> }>();
  for (const option of options) {
    const key = [
      option.professor_name.trim().toLowerCase(),
      [...option.theory_slots].sort().join(","),
      [...option.lab_slots].sort().join(",")
    ].join("|");
    const entry = byKey.get(key) ?? { option, programs: new Set<string>() };
    if (isTagged(option.program)) entry.programs.add(option.program);
    byKey.set(key, entry);
  }
  return [...byKey.values()].map(({ option, programs }) => ({
    ...option,
    program: programs.size > 0 ? [...programs].sort().join("/") : null
  }));
}

/**
 * Search covers every course; the program only decides order and options.
 * A course with rows for `program` is "yours" and keeps only those rows.
 * Any other course keeps the union of its rows. Yours come first; both
 * groups keep their incoming order.
 */
export function scopeCatalog(courses: DBCourse[], program: string | null) {
  const mine: DBCourse[] = [];
  const rest: DBCourse[] = [];
  for (const course of courses) {
    const own = program ? course.course_options.filter((option) => option.program === program) : [];
    if (own.length > 0) {
      mine.push({ ...course, course_options: dedupeOptions(own) });
    } else {
      rest.push({ ...course, course_options: dedupeOptions(course.course_options) });
    }
  }
  return { courses: [...mine, ...rest], mineCount: mine.length };
}
