import {
  Course,
  CourseOption,
  Constraints,
  TimeSlot,
} from "./types";
import {
  violatesOptionHardConstraints,
  getOptionSlotIds,
  indexSlots,
  rangesOverlap,
  formatMinutes,
  parseTime,
} from "./conflict";

export interface ConflictFinding {
  type:
    | "course_always_conflicts"
    | "course_no_eligible_options"
    | "constraint_eliminates_course";
  courseCodeA: string;
  courseCodeB?: string;
  constraintLabel?: string;
  description: string;
  severity: "error";
}

/**
 * Diagnoses why zero valid timetables exist for the given courses/constraints.
 *
 * This is a fast diagnostic pass — NOT a re-run of the full backtracking
 * generator. It checks two specific failure patterns that together explain
 * the overwhelming majority of zero-result cases:
 *
 *   1. A course has zero options left after constraints are applied
 *   2. Two courses have no combination of options that doesn't conflict
 *
 * It does NOT diagnose complex multi-course interactions (e.g. "A, B, C have
 * valid pairs individually but no valid triple"). That's what the generator
 * already determined. The fallback message in ZeroResultsPanel handles that.
 */
export function analyzeZeroResultCause(
  courses: Course[],
  slots: TimeSlot[],
  constraints: Constraints
): ConflictFinding[] {
  const findings: ConflictFinding[] = [];
  const slotMap = indexSlots(slots);

  // ─── Pattern 1: a course has zero surviving options after constraints ───
  for (const course of courses) {
    if (course.options.length === 0) {
      findings.push({
        type: "course_no_eligible_options",
        courseCodeA: course.courseCode,
        description: `${course.courseCode} has no professor options added.`,
        severity: "error",
      });
      continue;
    }

    const survivingOptions = course.options.filter(
      (opt) => !violatesOptionHardConstraints(course, opt, constraints, slotMap)
    );

    if (survivingOptions.length === 0) {
      const label = identifyEliminatingConstraint(
        course,
        course.options,
        constraints,
        slotMap,
        slots
      );
      findings.push({
        type: "constraint_eliminates_course",
        courseCodeA: course.courseCode,
        constraintLabel: label,
        description: `Your "${label}" constraint removes every option for ${course.courseCode}.`,
        severity: "error",
      });
    }
  }

  // ─── Pattern 2: two courses always conflict across every option pair ───
  // Only check courses that have surviving options (skip already-dead courses)
  const viableCourses = courses.filter(
    (course) =>
      course.options.length > 0 &&
      course.options.some(
        (opt) =>
          !violatesOptionHardConstraints(course, opt, constraints, slotMap)
      )
  );

  for (let i = 0; i < viableCourses.length; i++) {
    for (let j = i + 1; j < viableCourses.length; j++) {
      const courseA = viableCourses[i];
      const courseB = viableCourses[j];

      // Only check surviving options — options already eliminated by
      // constraints can't contribute to a valid timetable anyway
      const optsA = courseA.options.filter(
        (opt) =>
          !violatesOptionHardConstraints(courseA, opt, constraints, slotMap)
      );
      const optsB = courseB.options.filter(
        (opt) =>
          !violatesOptionHardConstraints(courseB, opt, constraints, slotMap)
      );

      if (optsA.length === 0 || optsB.length === 0) continue;

      const allConflict = optsA.every((optA) =>
        optsB.every((optB) => optionsOverlap(optA, optB, slotMap))
      );

      if (allConflict) {
        const overlap = findFirstOverlapDetail(optsA[0], optsB[0], slotMap);
        const detail = overlap
          ? ` on ${overlap.day} ${overlap.time}`
          : "";
        findings.push({
          type: "course_always_conflicts",
          courseCodeA: courseA.courseCode,
          courseCodeB: courseB.courseCode,
          description: `${courseA.courseCode} and ${courseB.courseCode} always clash${detail} — every professor option overlaps.`,
          severity: "error",
        });
      }
    }
  }

  return findings;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Checks whether two options have any slot-time overlap.
 * Uses rangesOverlap from conflict.ts — the same function the generator uses.
 */
function optionsOverlap(
  optA: CourseOption,
  optB: CourseOption,
  slotMap: Map<string, TimeSlot>
): boolean {
  const idsA = getOptionSlotIds(optA);
  const idsB = getOptionSlotIds(optB);

  console.log("OPTION A", optA);
console.log("OPTION B", optB);
console.log("IDS A", getOptionSlotIds(optA));
console.log("IDS B", getOptionSlotIds(optB));

  for (const idA of idsA) {
    const slotA = slotMap.get(idA);
    if (!slotA) continue;
    for (const idB of idsB) {
      const slotB = slotMap.get(idB);
      if (!slotB) continue;
      if (slotA.day !== slotB.day) continue;
      if (
        rangesOverlap(
          slotA.startTime,
          slotA.endTime,
          slotB.startTime,
          slotB.endTime
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Finds the first overlapping slot pair between two options for display.
 */
function findFirstOverlapDetail(
  optA: CourseOption,
  optB: CourseOption,
  slotMap: Map<string, TimeSlot>
): { day: string; time: string } | null {
  const idsA = getOptionSlotIds(optA);
  const idsB = getOptionSlotIds(optB);

  for (const idA of idsA) {
    const slotA = slotMap.get(idA);
    if (!slotA) continue;
    for (const idB of idsB) {
      const slotB = slotMap.get(idB);
      if (!slotB) continue;
      if (slotA.day !== slotB.day) continue;
      if (
        rangesOverlap(
          slotA.startTime,
          slotA.endTime,
          slotB.startTime,
          slotB.endTime
        )
      ) {
        const overlapStart = Math.max(
          parseTime(slotA.startTime),
          parseTime(slotB.startTime)
        );
        const overlapEnd = Math.min(
          parseTime(slotA.endTime),
          parseTime(slotB.endTime)
        );
        return {
          day: slotA.day,
          time: `${formatMinutes(overlapStart)}–${formatMinutes(overlapEnd)}`,
        };
      }
    }
  }
  return null;
}

/**
 * Best-effort: identifies which constraint is responsible for eliminating
 * all options of a course. Checks each constraint type individually.
 */
function identifyEliminatingConstraint(
  course: Course,
  options: CourseOption[],
  constraints: Constraints,
  slotMap: Map<string, TimeSlot>,
  slots: TimeSlot[]
): string {
  // Professor locks — only specific professors allowed
  const lockedForCourse = constraints.professorLocks.filter((lock) =>
    lock.startsWith(`${course.id}:`)
  );
  if (lockedForCourse.length > 0) {
    const allLocked = options.every(
      (opt) => !lockedForCourse.includes(`${course.id}:${opt.id}`)
    );
    if (allLocked) return "Professor lock";
  }

  // Avoided professors
  if (constraints.avoidProfessors.length > 0) {
    const allAvoided = options.every((opt) =>
      constraints.avoidProfessors.some(
        (prof) =>
          prof.trim().length > 0 &&
          opt.professorName.toLowerCase().includes(prof.toLowerCase())
      )
    );
    if (allAvoided) return "Avoided professor list";
  }

  // noAfterTime
  if (constraints.noAfterTime) {
    const threshold = parseTime(constraints.noAfterTime);
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && parseTime(slot.endTime) > threshold;
      })
    );
    if (allViolate) return `No classes after ${constraints.noAfterTime}`;
  }

  // earliestStart
  if (constraints.earliestStart) {
    const threshold = parseTime(constraints.earliestStart);
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && parseTime(slot.startTime) < threshold;
      })
    );
    if (allViolate)
      return `No classes before ${constraints.earliestStart}`;
  }

  // latestEnd
  if (constraints.latestEnd) {
    const threshold = parseTime(constraints.latestEnd);
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && parseTime(slot.endTime) > threshold;
      })
    );
    if (allViolate)
      return `Must end before ${constraints.latestEnd}`;
  }

  // avoidFirstPeriod
  if (constraints.avoidFirstPeriod) {
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && parseTime(slot.startTime) < 10 * 60;
      })
    );
    if (allViolate) return "Avoid first period";
  }

  // avoidLastPeriod
  if (constraints.avoidLastPeriod) {
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && parseTime(slot.endTime) > 17 * 60;
      })
    );
    if (allViolate) return "Avoid last period";
  }

  // Blocked windows
  if (constraints.blockedWindows.length > 0) {
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        if (!slot) return false;
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
      })
    );
    if (allViolate) {
      const window = constraints.blockedWindows[0];
      const label =
        window.label ||
        `Blocked window (${window.day} ${window.startTime}–${window.endTime})`;
      return label;
    }
  }

  // Day-specific constraints
  for (const [day, time] of Object.entries(constraints.endBeforeByDay)) {
    if (!time) continue;
    const threshold = parseTime(time);
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && slot.day === day && parseTime(slot.endTime) > threshold;
      })
    );
    if (allViolate)
      return `End before ${time} on ${day}`;
  }

  return "your current constraints";
}
