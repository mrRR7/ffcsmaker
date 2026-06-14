import {
  Course,
  CourseOption,
  Constraints,
  DayOfWeek,
  DAYS,
  TimeSlot,
  TimetableSelection
} from "./types";

export function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

export function formatMinutes(minutes: number): string {
  const normalized = Math.max(0, Math.round(minutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0h";
  }
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) {
    return `${minutes}m`;
  }
  return minutes > 0 ? `${whole}h ${minutes}m` : `${whole}h`;
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return parseTime(startA) < parseTime(endB) && parseTime(startB) < parseTime(endA);
}

export function getOptionSlotIds(option: CourseOption) {
  return Array.from(
    new Set([
      ...option.theorySlotIds,
      ...option.labSlotIds,
      ...option.combinedSlotIds
    ])
  );
}

export function indexSlots(slots: TimeSlot[]) {
  return new Map(slots.map((slot) => [slot.id, slot]));
}

export function getSlotsForSelection(
  selection: Pick<
    TimetableSelection,
    "theorySlotIds" | "labSlotIds" | "combinedSlotIds"
  >,
  slotMap: Map<string, TimeSlot>
) {
  return getOptionSlotIds({
    id: "",
    professorName: "",
    theorySlotIds: selection.theorySlotIds,
    labSlotIds: selection.labSlotIds,
    combinedSlotIds: selection.combinedSlotIds
  }).flatMap((slotId) => {
    const slot = slotMap.get(slotId);
    return slot ? [slot] : [];
  });
}

export function hasInternalSlotConflict(
  option: CourseOption,
  slotMap: Map<string, TimeSlot>
) {
  const slots = getOptionSlotIds(option).flatMap((slotId) => {
    const slot = slotMap.get(slotId);
    return slot ? [slot] : [];
  });

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (
        slots[i].day === slots[j].day &&
        rangesOverlap(
          slots[i].startTime,
          slots[i].endTime,
          slots[j].startTime,
          slots[j].endTime
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export function conflictsWithExisting(
  option: CourseOption,
  selectedSlotIds: string[],
  slotMap: Map<string, TimeSlot>
) {
  const existing = selectedSlotIds.flatMap((slotId) => {
    const slot = slotMap.get(slotId);
    return slot ? [slot] : [];
  });

  const incoming = getOptionSlotIds(option).flatMap((slotId) => {
    const slot = slotMap.get(slotId);
    return slot ? [slot] : [];
  });

  return incoming.some((slot) =>
    existing.some(
      (used) =>
        used.day === slot.day &&
        rangesOverlap(slot.startTime, slot.endTime, used.startTime, used.endTime)
    )
  );
}

export function violatesSlotHardConstraints(
  slot: TimeSlot,
  constraints: Constraints
) {
  if (constraints.earliestStart && parseTime(slot.startTime) < parseTime(constraints.earliestStart)) return true;
  if (constraints.latestEnd && parseTime(slot.endTime) > parseTime(constraints.latestEnd)) return true;

  const dayStart = constraints.startAfterByDay[slot.day];
  if (dayStart && parseTime(slot.startTime) < parseTime(dayStart)) return true;

  const dayEnd = constraints.latestEndByDay[slot.day];
  if (dayEnd && parseTime(slot.endTime) > parseTime(dayEnd)) return true;

  if (
    constraints.noAfterTime &&
    parseTime(slot.endTime) > parseTime(constraints.noAfterTime)
  ) {
    return true;
  }

  if (constraints.avoidFirstPeriod && parseTime(slot.startTime) < 10 * 60) {
    return true;
  }

  if (constraints.avoidLastPeriod && parseTime(slot.endTime) > 17 * 60) {
    return true;
  }

  const dayLimit = constraints.endBeforeByDay[slot.day];
  if (dayLimit && parseTime(slot.endTime) > parseTime(dayLimit)) {
    return true;
  }

  return constraints.blockedWindows.some(
    (blocked) =>
      (blocked.day === "All" || blocked.day === slot.day) &&
      rangesOverlap(
        slot.startTime,
        slot.endTime,
        blocked.startTime,
        blocked.endTime
      )
  );
}

export function violatesOptionHardConstraints(
  course: Course,
  option: CourseOption,
  constraints: Constraints,
  slotMap: Map<string, TimeSlot>
) {
  const lockedForCourse = constraints.professorLocks.filter((lock) =>
    lock.startsWith(`${course.id}:`)
  );
  if (
    lockedForCourse.length > 0 &&
    !lockedForCourse.includes(`${course.id}:${option.id}`)
  ) {
    return true;
  }

  if (
    constraints.avoidProfessors.some(
      (professor) =>
        professor.trim().length > 0 &&
        option.professorName.toLowerCase().includes(professor.toLowerCase())
    )
  ) {
    return true;
  }

  if (hasInternalSlotConflict(option, slotMap)) {
    return true;
  }

  return getOptionSlotIds(option).some((slotId) => {
    const slot = slotMap.get(slotId);
    return !slot || violatesSlotHardConstraints(slot, constraints);
  });
}

export function classesPerDay(
  slotIds: string[],
  slotMap: Map<string, TimeSlot>
) {
  const counts: Record<DayOfWeek, number> = DAYS.reduce(
    (acc, day) => ({ ...acc, [day]: 0 }),
    {} as Record<DayOfWeek, number>
  );

  slotIds.forEach((slotId) => {
    const slot = slotMap.get(slotId);
    if (slot) {
      counts[slot.day] += 1;
    }
  });

  return counts;
}

export function buildSelection(
  course: Course,
  option: CourseOption,
  slotMap: Map<string, TimeSlot>
): TimetableSelection {
  const slots = getOptionSlotIds(option)
    .flatMap((slotId) => {
      const slot = slotMap.get(slotId);
      return slot ? [slot] : [];
    })
    .sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return dayDiff || parseTime(a.startTime) - parseTime(b.startTime);
    });

  return {
    courseId: course.id,
    courseCode: course.courseCode,
    courseName: course.courseName,
    optionId: option.id,
    professorName: option.professorName,
    credits: course.credits,
    theorySlotIds: option.theorySlotIds,
    labSlotIds: option.labSlotIds,
    combinedSlotIds: option.combinedSlotIds,
    displaySlots: slots.map((slot) => `${slot.label} ${slot.startTime}-${slot.endTime}`)
  };
}
