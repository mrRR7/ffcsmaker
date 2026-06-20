import { ParsedImportRow } from './importTypes';
import { Course, CourseOption, TimeSlot } from '@/engine/types';
import { resolveLabSlotIds, resolveTheorySlotIds } from './normalizeImport';
import { nanoid } from 'nanoid';

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

function colorForIndex(index: number) {
  return courseColors[index % courseColors.length];
}

export function transformToCourses(
  validRows: ParsedImportRow[],
  existingCourses: Course[],
  slots: TimeSlot[],
  program: string | null
): { updatedCourses: Course[], locks: string[] } {
  // Deep clone to avoid mutating state directly
  const coursesMap = new Map<string, Course>();
  
  for (const c of existingCourses) {
    coursesMap.set(c.courseCode, {
      ...c,
      options: c.options.map(o => ({ ...o }))
    });
  }

  const newLocks: string[] = [];

  for (const row of validRows) {
    if (!row.isValid) continue;

    const courseCode = row.courseCode.trim().toUpperCase();
    const courseName = row.courseName.trim();
    const professorName = row.professorName.trim();
    const credits = Number(row.credits);
    
    if (!coursesMap.has(courseCode)) {
      coursesMap.set(courseCode, {
        id: nanoid(),
        courseCode,
        courseName,
        credits,
        options: [],
        color: colorForIndex(coursesMap.size)
      });
    }

    const course = coursesMap.get(courseCode)!;

    const theorySlotIds = resolveTheorySlotIds(row.theorySlots, slots);
    const labSlotIds = resolveLabSlotIds(row.labSlots, slots);

    const newOption: CourseOption = {
      id: nanoid(),
      professorName,
      program,
      theorySlotIds,
      labSlotIds,
      combinedSlotIds: [],
      notes: row.notes?.trim() || ""
    };
    
    course.options.push(newOption);

    if (row.locked && row.locked.trim().toLowerCase() === 'true') {
       newLocks.push(`${course.id}:${newOption.id}`);
    }
  }

  return {
    updatedCourses: Array.from(coursesMap.values()),
    locks: newLocks
  };
}
