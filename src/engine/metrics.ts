import { DAYS, ScheduleMetrics, TimeSlot, TimetableSelection } from "./types";
import {
  formatMinutes,
  getSlotsForSelection,
  parseTime
} from "./conflict";

function variance(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (
    values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
    values.length
  );
}

export function computeScheduleMetrics(
  selections: TimetableSelection[],
  slots: TimeSlot[]
): ScheduleMetrics {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const scheduledSlots = selections.flatMap((selection) =>
    getSlotsForSelection(selection, slotMap)
  );

  const byDay = new Map(
    DAYS.map((day) => [
      day,
      scheduledSlots
        .filter((slot) => slot.day === day)
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
    ])
  );

  const activeDays = DAYS.filter((day) => (byDay.get(day)?.length ?? 0) > 0);
  const gaps: number[] = [];
  let halfDays = 0;
  let morningClassCount = 0;
  let eveningClassCount = 0;

  scheduledSlots.forEach((slot) => {
    if (parseTime(slot.startTime) < 12 * 60) {
      morningClassCount += 1;
    }
    if (parseTime(slot.endTime) > 17 * 60) {
      eveningClassCount += 1;
    }
  });

  activeDays.forEach((day) => {
    const daySlots = byDay.get(day) ?? [];
    if (daySlots.length === 0) {
      return;
    }

    const first = daySlots[0];
    const last = daySlots[daySlots.length - 1];
    const spanMinutes = parseTime(last.endTime) - parseTime(first.startTime);
    if (spanMinutes <= 4 * 60) {
      halfDays += 1;
    }

    for (let index = 0; index < daySlots.length - 1; index += 1) {
      const gap =
        parseTime(daySlots[index + 1].startTime) - parseTime(daySlots[index].endTime);
      if (gap > 0) {
        gaps.push(gap);
      }
    }
  });

  const starts = scheduledSlots.map((slot) => parseTime(slot.startTime));
  const ends = scheduledSlots.map((slot) => parseTime(slot.endTime));
  const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap, 0);
  const totalGapSlots = gaps.reduce((sum, gap) => {
    if (gap <= 20) {
      return sum;
    }
    return sum + Math.max(1, Math.round(gap / 55));
  }, 0);
  const classCounts = DAYS.map((day) => byDay.get(day)?.length ?? 0);
  const activeClassCounts = classCounts.filter((count) => count > 0);
  const averageEnd =
    ends.length > 0 ? ends.reduce((sum, end) => sum + end, 0) / ends.length : 0;
  const compactness = Math.max(
    0,
    Math.min(100, 100 - totalGapMinutes / 12 - activeDays.length * 2)
  );

  return {
    freeDays: DAYS.length - activeDays.length,
    halfDays,
    totalGapHours: Number((totalGapMinutes / 60).toFixed(2)),
    totalGapSlots,
    averageGapHours:
      gaps.length > 0
        ? Number((totalGapMinutes / gaps.length / 60).toFixed(2))
        : 0,
    compactness: Number(compactness.toFixed(1)),
    earliestStartTime: starts.length ? formatMinutes(Math.min(...starts)) : "00:00",
    latestEndTime: ends.length ? formatMinutes(Math.max(...ends)) : "00:00",
    averageEndTime: ends.length ? formatMinutes(averageEnd) : "00:00",
    morningClassCount,
    eveningClassCount,
    totalClasses: scheduledSlots.length,
    activeDays: activeDays.length,
    dailyLoadVariance: Number(variance(activeClassCounts).toFixed(2)),
    facultyMatchPercentage: 0
  };
}
