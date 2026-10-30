import type { Campus } from "@/engine/types";
import { DBCourse, DBCourseOption } from "@/types/db";

/** Kill switch: NEXT_PUBLIC_PROGRAM_PICKER=off hides the picker and searches every course.
 * Inlined at build time, so flipping it needs a redeploy. */
export const PROGRAM_PICKER_ENABLED = process.env.NEXT_PUBLIC_PROGRAM_PICKER !== "off";

// Friendly names for program codes. A code missing here shows as itself, so a
// newly uploaded program never breaks the list.
export const PROGRAM_NAMES: Record<string, string> = {
  BCE: "B.Tech CSE",
  BPS: "B.Tech CSE (CPS)",
  BYB: "B.Tech CSE (Cyber Security)",
  BYC: "B.Tech CSE (Cyber Security, Deakin 2+2)",
  BDS: "B.Tech CSE (Data Science)",
  BAI: "B.Tech CSE (AI & ML)",
  BRS: "B.Tech CSE (AI & Robotics)",
  BAD: "B.Tech CSE (AI & DS)",
  BQC: "B.Tech CSE (Quantum Computing)",
  BEE: "B.Tech EEE",
  BEL: "B.Tech ECSE",
  BEC: "B.Tech ECE",
  BLC: "B.Tech ECM",
  BVL: "B.Tech Electronics (VLSI)",
  BME: "B.Tech Mechanical",
  BMV: "B.Tech Mechanical (EV)",
  BMH: "B.Tech Mechatronics & Automation",
  BCL: "B.Tech Civil",
  BCT: "B.Tech Civil (L&T)",
  BBT: "B.Tech Biotechnology",
  BFT: "B.Tech Fashion Technology",
  MID: "Int. M.Tech CSE (Data Science)",
  MIA: "Int. M.Tech (Business Analytics)",
  MIS: "Int. M.Tech Software Engineering",
  // Vellore tags by school and batch, not by branch.
  SENSE25: "SENSE (’25 batch)",
  SCORE25: "SCORE (’25 batch)",
  SCOPE25: "SCOPE (’25 batch)",
  MIS25: "MIS (’25 batch)",
  SCOPE: "SCOPE (senior batches)",
  MTECH: "M.Tech",
  SCE25: "SCE (’25 batch)",
  SHINE25: "SHINE (’25 batch)",
  SHINE: "SHINE (senior batches)",
  SELECT25: "SELECT (’25 batch)"
};

/** What a program is called on each campus: Vellore's codes are schools. */
export function programNoun(campus: Campus | null) {
  return campus === "vellore" ? "school" : "program";
}

/** programNoun for the start of a label: "School" / "Program". */
export function programNounTitle(campus: Campus | null) {
  return campus === "vellore" ? "School" : "Program";
}

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
