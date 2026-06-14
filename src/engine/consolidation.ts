import { DAYS, ScoredTimetable, TimeSlot, TimetableShapeGroup } from "./types";
import { indexSlots } from "./conflict";

export function getTimetableShapeFingerprint(
  schedule: ScoredTimetable,
  slotMap: Map<string, TimeSlot>
): string {
  const allSlotIds = new Set<string>();

  for (const selection of schedule.selections) {
    for (const slotId of selection.theorySlotIds) allSlotIds.add(slotId);
    for (const slotId of selection.labSlotIds) allSlotIds.add(slotId);
    for (const slotId of selection.combinedSlotIds) allSlotIds.add(slotId);
  }

  const occupiedSlots: TimeSlot[] = [];
  for (const slotId of allSlotIds) {
    const slot = slotMap.get(slotId);
    if (slot) {
      occupiedSlots.push(slot);
    }
  }

  // Sort by day first, then by start time
  occupiedSlots.sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayDiff !== 0) {
      return dayDiff;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Fingerprint comes from resolved day, startTime, endTime data
  return occupiedSlots
    .map((slot) => `${slot.day}-${slot.startTime}-${slot.endTime}`)
    .join("|");
}

export function consolidateSchedulesByShape(
  schedules: ScoredTimetable[],
  slots: TimeSlot[]
): ScoredTimetable[] {
  const slotMap = indexSlots(slots);
  const groups = new Map<string, ScoredTimetable[]>();

  for (const schedule of schedules) {
    const shape = getTimetableShapeFingerprint(schedule, slotMap);
    if (!groups.has(shape)) {
      groups.set(shape, []);
    }
    groups.get(shape)!.push(schedule);
  }

  const consolidated: ScoredTimetable[] = [];

  for (const group of groups.values()) {
    // Pick the highest scoring schedule in the group as representative
    group.sort((a, b) => b.score - a.score);
    consolidated.push(group[0]);
  }

  // Logging
  const originalCount = schedules.length;
  const uniqueShapes = groups.size;
  const removed = originalCount - uniqueShapes;
  const reduction = originalCount > 0 ? ((removed / originalCount) * 100).toFixed(1) : "0.0";

  console.log(`--- Shape Consolidation Metrics ---`);
  console.log(`Generated: ${originalCount} schedules`);
  console.log(`Unique shapes: ${uniqueShapes}`);
  console.log(`Removed: ${removed} duplicates`);
  console.log(`Reduction: ${reduction}%`);
  console.log(`-----------------------------------`);

  // Final sort to ensure the consolidated array is strictly ordered by score
  consolidated.sort((a, b) => b.score - a.score);

  return consolidated;
}

export function groupSchedulesByShape(
  schedules: ScoredTimetable[],
  slots: TimeSlot[]
): TimetableShapeGroup[] {
  const slotMap = indexSlots(slots);
  const groups = new Map<string, ScoredTimetable[]>();

  for (const schedule of schedules) {
    const shape = getTimetableShapeFingerprint(schedule, slotMap);
    if (!groups.has(shape)) {
      groups.set(shape, []);
    }
    groups.get(shape)!.push(schedule);
  }

  const result: TimetableShapeGroup[] = [];

  for (const [fingerprint, group] of groups) {
    group.sort((a, b) => b.score - a.score);
    const representative = group[0];
    const alternatives = group.slice(1);

    const repFacultyScore = representative.scoreBreakdown.facultyPreference ?? 0;
    
    // Find best faculty variant (must exceed representative by a meaningful threshold, e.g., >10% improvement and >1 absolute score diff)
    const bestFaculty = group.reduce((best, s) =>
      (s.scoreBreakdown.facultyPreference ?? 0) > (best.scoreBreakdown.facultyPreference ?? 0) ? s : best
    , representative);

    const bestFacultyScore = bestFaculty.scoreBreakdown.facultyPreference ?? 0;
    const isMeaningfulImprovement = bestFacultyScore > repFacultyScore * 1.1 && bestFacultyScore > repFacultyScore + 1;

    result.push({
      shapeFingerprint: fingerprint,
      representative,
      bestFacultyVariant: isMeaningfulImprovement && bestFaculty.id !== representative.id ? bestFaculty : null,
      alternatives,
      variantCount: group.length,
    });
  }

  result.sort((a, b) => b.representative.score - a.representative.score);
  return result;
}
