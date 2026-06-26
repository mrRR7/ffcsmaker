import { DBCourse } from "@/types/db";
import type { PlannerImportJSON } from "@/features/vtop-scraper/types";

export interface VtopCatalogDiff {
  newCourses: { courseCode: string; courseName: string }[];
  newFaculty: { courseCode: string; professorName: string }[];
  slotChanges: {
    courseCode: string;
    professorName: string;
    catalogSlots: string;
    vtopSlots: string;
  }[];
  creditChanges: {
    courseCode: string;
    catalogCredits: number;
    vtopCredits: number;
  }[];
  stats: {
    courseCount: number;
    optionCount: number;
    facultyCount: number;
    newCourseCount: number;
    newFacultyCount: number;
    slotChangeCount: number;
    creditChangeCount: number;
  };
}

function normalizeSlots(slots: string[]): string {
  return slots
    .map((slot) => slot.replace(/\s+/g, "").toUpperCase())
    .filter(Boolean)
    .sort()
    .join("+");
}

function slotLabel(theory: string[], lab: string[]): string {
  const parts = [normalizeSlots(theory), normalizeSlots(lab)].filter(Boolean);
  return parts.join(" / ") || "None";
}

function findProfessorOption(
  catalogCourse: DBCourse | undefined,
  professorName: string
) {
  if (!catalogCourse) return undefined;
  const needle = professorName.trim().toLowerCase();
  return catalogCourse.course_options.find(
    (option) => option.professor_name.trim().toLowerCase() === needle
  );
}

export function compareVtopToCatalog(
  payload: PlannerImportJSON,
  catalog: DBCourse[]
): VtopCatalogDiff {
  const catalogByCode = new Map(
    catalog.map((course) => [course.course_code.trim().toUpperCase(), course])
  );

  const newCourses: VtopCatalogDiff["newCourses"] = [];
  const newFaculty: VtopCatalogDiff["newFaculty"] = [];
  const slotChanges: VtopCatalogDiff["slotChanges"] = [];
  const creditChanges: VtopCatalogDiff["creditChanges"] = [];
  const facultySeen = new Set<string>();

  let optionCount = 0;

  for (const course of payload.courses) {
    const code = course.courseCode.trim().toUpperCase();
    const catalogCourse = catalogByCode.get(code);

    if (!catalogCourse) {
      newCourses.push({ courseCode: code, courseName: course.courseName || code });
    } else if (Number(catalogCourse.credits) !== Number(course.credits)) {
      creditChanges.push({
        courseCode: code,
        catalogCredits: Number(catalogCourse.credits) || 0,
        vtopCredits: Number(course.credits) || 0,
      });
    }

    for (const option of course.options) {
      optionCount += 1;
      const professor = option.professorName.trim();
      if (!professor) continue;

      facultySeen.add(professor.toLowerCase());

      const catalogOption = findProfessorOption(catalogCourse, professor);
      if (!catalogOption) {
        newFaculty.push({ courseCode: code, professorName: professor });
        continue;
      }

      const vtopSlots = slotLabel(option.theorySlots, option.labSlots);
      const catalogSlots = slotLabel(
        catalogOption.theory_slots ?? [],
        catalogOption.lab_slots ?? []
      );

      if (vtopSlots !== catalogSlots) {
        slotChanges.push({
          courseCode: code,
          professorName: professor,
          catalogSlots,
          vtopSlots,
        });
      }
    }
  }

  return {
    newCourses,
    newFaculty,
    slotChanges,
    creditChanges,
    stats: {
      courseCount: payload.courses.length,
      optionCount,
      facultyCount: facultySeen.size,
      newCourseCount: newCourses.length,
      newFacultyCount: newFaculty.length,
      slotChangeCount: slotChanges.length,
      creditChangeCount: creditChanges.length,
    },
  };
}
