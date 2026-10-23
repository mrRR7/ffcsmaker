import { Campus, Course, TimeSlot } from "@/engine/types";
import { loadCatalog } from "@/lib/catalogCache";
import { mergeCourseOptions } from "@/features/courses/mergeCourseOptions";
import { scopeCatalog } from "@/features/programs/programCatalog";

// Common courses the tour can load into an empty plan. Codes, not options, so
// they always resolve to the live catalog's current professors and slots.
export const SAMPLE_COURSE_CODES: Partial<Record<Campus, string[]>> = {
  chennai: ["BACSE104", "BAMAT207", "BAENG101", "BAHUM103", "BACSE203"]
};

/** Resolves the sample codes through the same program scoping as catalog search. Missing codes are skipped. */
export async function buildSampleCourses(campus: Campus, program: string | null, slots: TimeSlot[]): Promise<Course[]> {
  const codes = SAMPLE_COURSE_CODES[campus] ?? [];
  const { courses: catalog } = await loadCatalog(campus);
  const found = codes
    .map((code) => catalog.find((course) => course.course_code === code))
    .filter((course) => course !== undefined);
  const { courses } = scopeCatalog(found, program);
  return mergeCourseOptions(
    [],
    courses.flatMap((course) =>
      course.course_options.map((option) => ({
        courseCode: course.course_code,
        courseName: course.course_name,
        credits: course.credits,
        professorName: option.professor_name,
        program: option.program,
        theorySlotsRaw: option.theory_slots.join(", "),
        labSlotsRaw: option.lab_slots.join(", "),
        notes: option.professor_notes ?? ""
      }))
    ),
    slots
  ).courses;
}
