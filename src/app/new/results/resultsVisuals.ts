import { Course, DayOfWeek, ScoredTimetable, TimeSlot } from "@/engine/types";
import { buildMatrixCells } from "@/features/results/timetableMatrix";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { parseTime } from "@/engine/conflict";

/**
 * Picks readable text color (near-black or near-white) for a given hex
 * background using relative luminance. Courses carry an arbitrary
 * student-picked color, so we can't assume a fixed text color for every
 * block — this keeps the mono course-code label legible either way.
 */
export function readableTextColor(hex: string | undefined): string {
  if (!hex || hex[0] !== "#" || (hex.length !== 7 && hex.length !== 4)) {
    return "#0b0e11";
  }
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = Number.parseInt(full.slice(1, 3), 16);
  const g = Number.parseInt(full.slice(3, 5), 16);
  const b = Number.parseInt(full.slice(5, 7), 16);
  if ([r, g, b].some((c) => Number.isNaN(c))) {
    return "#0b0e11";
  }
  // Relative luminance (sRGB).
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  return luminance > 0.55 ? "#0b0e11" : "#f2f7f4";
}

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
  courses: Course[]
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
  const bandSize = span / THUMBNAIL_BANDS;

  const matrix = buildMatrixCells(schedule, slots, courses);
  const allCells = [...matrix.theory.flat(), ...matrix.lab.flat()].filter(
    (cell) => cell.occupied && cell.slot
  );

  return days.map((day) => {
    const dayCells = allCells.filter((cell) => cell.day === day);
    return Array.from({ length: THUMBNAIL_BANDS }, (_, bandIndex) => {
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
