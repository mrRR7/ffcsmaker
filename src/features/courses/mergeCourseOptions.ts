import { nanoid } from "nanoid";
import { Course, CourseOption, TimeSlot } from "@/engine/types";
import {
  resolveLabSlotIds,
  resolveTheorySlotIds
} from "@/features/import/normalizeImport";

const courseColors = [
  "#14b8a6",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#a78bfa",
  "#f97316"
];

export type CourseOptionInput = {
  courseCode: string;
  courseName: string;
  credits: number;
  professorName: string;
  theorySlotsRaw?: string;
  labSlotsRaw?: string;
  notes?: string;
};

function colorForIndex(index: number) {
  return courseColors[index % courseColors.length];
}

function optionKey(option: Pick<CourseOption, "professorName" | "theorySlotIds" | "labSlotIds">) {
  return [
    option.professorName.trim().toLowerCase(),
    [...option.theorySlotIds].sort().join(","),
    [...option.labSlotIds].sort().join(",")
  ].join("|");
}

export function mergeCourseOptions(
  existingCourses: Course[],
  inputs: CourseOptionInput[],
  slots: TimeSlot[]
) {
  const courses = existingCourses.map((course) => ({
    ...course,
    options: course.options.map((option) => ({ ...option }))
  }));
  const byCode = new Map(
    courses.map((course) => [course.courseCode.trim().toUpperCase(), course])
  );
  let addedCourses = 0;
  let addedOptions = 0;

  for (const input of inputs) {
    const courseCode = input.courseCode.trim().toUpperCase();
    if (!courseCode || !input.professorName.trim()) {
      continue;
    }

    const theorySlotIds = resolveTheorySlotIds(input.theorySlotsRaw, slots);
    const labSlotIds = resolveLabSlotIds(input.labSlotsRaw, slots);
    if (theorySlotIds.length === 0 && labSlotIds.length === 0) {
      continue;
    }

    let course = byCode.get(courseCode);
    if (!course) {
      course = {
        id: nanoid(),
        courseCode,
        courseName: input.courseName.trim() || courseCode,
        credits: input.credits || 3,
        color: colorForIndex(courses.length),
        options: []
      };
      byCode.set(courseCode, course);
      courses.push(course);
      addedCourses += 1;
    }

    const option: CourseOption = {
      id: nanoid(),
      professorName: input.professorName.trim(),
      theorySlotIds,
      labSlotIds,
      combinedSlotIds: [],
      notes: input.notes?.trim() ?? ""
    };
    const existingKeys = new Set(course.options.map(optionKey));
    if (!existingKeys.has(optionKey(option))) {
      course.options.push(option);
      addedOptions += 1;
    }
  }

  return { courses, addedCourses, addedOptions };
}
