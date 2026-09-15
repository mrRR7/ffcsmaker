import { Course, ScoredTimetable, TimeSlot } from "@/engine/types";
import { getScheduleDayBlocks } from "./scheduleVisuals";

export interface DiffItem {
  label: string;
  values: string[];
}

/**
 * "What differs" summary for the schedules currently selected in Compare —
 * derived entirely from real schedule/course/slot data (day occupancy,
 * metrics, shared-course professors), never fabricated.
 */
export function computeDiffs(
  selected: ScoredTimetable[],
  slots: TimeSlot[],
  courses: Course[]
): DiffItem[] {
  if (selected.length < 2) {
    return [];
  }

  const items: DiffItem[] = [];
  const perSchedule = selected.map((schedule) => getScheduleDayBlocks(schedule, slots, courses));
  const days = perSchedule[0]?.days ?? [];

  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const labels = perSchedule.map(({ blocksByDay }) => {
      const count = blocksByDay[dayIndex]?.length ?? 0;
      if (count === 0) return "free";
      if (count === 1) return "one class";
      return `${count} classes`;
    });
    if (new Set(labels).size > 1) {
      items.push({ label: days[dayIndex]!, values: labels });
      break;
    }
  }

  const starts = selected.map((schedule) => schedule.metrics.earliestStartTime);
  if (new Set(starts).size > 1) {
    items.push({ label: "Earliest start", values: starts });
  }

  const codeSets = selected.map((schedule) => new Set(schedule.selections.map((s) => s.courseCode)));
  const commonCodes = [...(codeSets[0] ?? [])].filter((code) => codeSets.every((set) => set.has(code)));
  for (const code of commonCodes) {
    const professors = selected.map(
      (schedule) => schedule.selections.find((s) => s.courseCode === code)?.professorName ?? "—"
    );
    if (new Set(professors).size > 1) {
      items.push({ label: `${code} professor`, values: professors });
      break;
    }
  }

  const gaps = selected.map((schedule) => String(schedule.metrics.totalGapSlots));
  if (new Set(gaps).size > 1) {
    items.push({ label: "Idle gaps", values: gaps });
  }

  return items;
}
