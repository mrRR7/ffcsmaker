import { Course, DayOfWeek, ScoredTimetable, TimeSlot } from "@/engine/types";
import { buildMatrixCells } from "@/features/results/timetableMatrix";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { parseTime } from "@/engine/conflict";

export type ThumbnailCell = { color: string | null };

const THUMBNAIL_BANDS = 4;
const THUMBNAIL_MAX_DAYS = 5;

/**
 * Builds a small (up to 5-day x 4-band) grid of real per-course colors for
 * the shapes rail thumbnail — a coarse illustration of which broad part of
 * the day is occupied, using each course's own configured color (not a
 * synthetic depth family) so the thumbnail stays true to the real schedule.
 */
export function buildShapeThumbnail(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  courses: Course[],
  bands = THUMBNAIL_BANDS
): ThumbnailCell[][] {
  const days = getSlotDaysForSlots(slots).slice(0, THUMBNAIL_MAX_DAYS) as DayOfWeek[];
  if (days.length === 0 || slots.length === 0) {
    return [];
  }

  const times = slots.map((slot) => parseTime(slot.startTime));
  const endTimes = slots.map((slot) => parseTime(slot.endTime));
  const dayStart = Math.min(...times);
  const dayEnd = Math.max(...endTimes);
  const span = Math.max(1, dayEnd - dayStart);
  const bandSize = span / bands;

  const matrix = buildMatrixCells(schedule, slots, courses);
  const allCells = [...matrix.theory.flat(), ...matrix.lab.flat()].filter(
    (cell) => cell.occupied && cell.slot
  );

  return days.map((day) => {
    const dayCells = allCells.filter((cell) => cell.day === day);
    return Array.from({ length: bands }, (_, bandIndex) => {
      const bandStart = dayStart + bandIndex * bandSize;
      const bandEnd = bandStart + bandSize;
      const match = dayCells.find((cell) => {
        const start = parseTime(cell.startTime || cell.slot!.startTime);
        const end = parseTime(cell.endTime || cell.slot!.endTime);
        return start < bandEnd && end > bandStart;
      });
      return { color: match?.color ?? null };
    });
  });
}

export function shortDay(day: DayOfWeek): string {
  return day.slice(0, 3).toUpperCase();
}

/**
 * Free-day names for the header metric run (e.g. "FRI free"). Mirrors the
 * same "no scheduled slot that day" logic computeScheduleMetrics uses for
 * ScheduleMetrics.freeDays, but keeps the day names instead of only a count.
 */
export function freeDayNames(schedule: ScoredTimetable, slots: TimeSlot[]): DayOfWeek[] {
  const days = getSlotDaysForSlots(slots) as readonly DayOfWeek[];
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const busyDays = new Set<DayOfWeek>();
  schedule.selections.forEach((selection) => {
    [...selection.theorySlotIds, ...selection.labSlotIds, ...selection.combinedSlotIds].forEach(
      (id) => {
        const slot = slotMap.get(id);
        if (slot) busyDays.add(slot.day);
      }
    );
  });
  return days.filter((day) => !busyDays.has(day));
}
