import type { VtopCourseOption } from "../types";
import { buildCourses, dedupeCourseOptions, optionDedupKey } from "./parse";
import type { VtopRawRow } from "./internal";

export function mergeRawRows(existing: VtopRawRow[], incoming: VtopRawRow[]): VtopRawRow[] {
  return existing.concat(incoming);
}

export function countCollectedOptions(rows: VtopRawRow[]): number {
  const { courses } = dedupeCourseOptions(buildCourses(rows));
  return courses.reduce((sum, c) => sum + c.options.length, 0);
}

export function countCollectedCourses(rows: VtopRawRow[]): number {
  const codes = new Set<string>();
  for (const row of rows) {
    if (row.courseCode) codes.add(row.courseCode);
  }
  return codes.size;
}

export function countDuplicateOptions(rows: VtopRawRow[]): number {
  const { duplicateCount } = dedupeCourseOptions(buildCourses(rows));
  return duplicateCount;
}

export function dedupeRawRowsByOption(rows: VtopRawRow[]): {
  rows: VtopRawRow[];
  duplicateCount: number;
} {
  const courses = buildCourses(rows);
  const { courses: deduped, duplicateCount } = dedupeCourseOptions(courses);

  const flattened: VtopRawRow[] = [];
  for (const course of deduped) {
    for (const opt of course.options) {
      flattened.push(...optionToRawRows(course.courseCode, course.courseName, opt));
    }
  }

  return { rows: flattened, duplicateCount };
}

function optionToRawRows(
  courseCode: string,
  courseName: string,
  option: VtopCourseOption
): VtopRawRow[] {
  const rows: VtopRawRow[] = [];
  const theoryJoined = option.theorySlots.join("+");
  const labJoined = option.labSlots.join("+");

  if (theoryJoined) {
    rows.push({
      courseCode,
      courseName,
      professorName: option.professorName,
      slot: theoryJoined,
      slotKind: "theory",
    });
  }
  if (labJoined) {
    rows.push({
      courseCode,
      courseName,
      professorName: option.professorName,
      slot: labJoined,
      slotKind: "lab",
    });
  }

  return rows;
}

export function hasOptionKey(
  seen: Set<string>,
  courseCode: string,
  option: VtopCourseOption
): boolean {
  return seen.has(optionDedupKey(courseCode, option));
}

export { optionDedupKey };
