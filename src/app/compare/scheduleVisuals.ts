import { Course, DayOfWeek, ScoredTimetable, TimeSlot } from "@/engine/types";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { buildMatrixCells } from "@/features/results/timetableMatrix";

/**
 * Derives a per-day list of occupied blocks (real course color + code) for a
 * schedule, reusing the same `buildMatrixCells` matrix math the classic
 * SlotMatrixTimetable renders from — theory and lab rows flattened in order,
 * lunch columns dropped. Used to draw the compact "week shape" thumbnails on
 * the FFCS Planner compare/saved cards without re-deriving matrix logic.
 */
export interface ScheduleDayBlock {
  id: string;
  color: string;
  code: string | null;
}

export function getScheduleDayBlocks(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  courses: Course[]
): { days: readonly DayOfWeek[]; blocksByDay: ScheduleDayBlock[][] } {
  const days = getSlotDaysForSlots(slots);
  const matrix = buildMatrixCells(schedule, slots, courses);
  const courseMap = new Map(courses.map((course) => [course.id, course]));

  const blocksByDay = days.map((_day, dayIndex) => {
    const theoryRow = matrix.theory[dayIndex] ?? [];
    const labRow = matrix.lab[dayIndex] ?? [];
    return [...theoryRow, ...labRow]
      .filter((cell) => cell.occupied && cell.slotLabel !== "Lunch")
      .map((cell) => {
        const course = cell.courseId ? courseMap.get(cell.courseId) : undefined;
        return {
          id: cell.id,
          color: course?.color ?? cell.color,
          code: cell.courseCode
        } satisfies ScheduleDayBlock;
      });
  });

  return { days, blocksByDay };
}

export function findFreeDay(days: readonly DayOfWeek[], blocksByDay: ScheduleDayBlock[][]) {
  const index = blocksByDay.findIndex((blocks) => blocks.length === 0);
  return index >= 0 ? days[index] : null;
}
