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
  buildSelection,
  classesPerDay,
  conflictsWithExisting,
  hasConsecutiveLabs,
} from "./conflict";
import { computeScheduleMetrics } from "./metrics";
import { defaultConstraints } from "./defaults";

export interface ConflictFinding {
  type:
    | "course_always_conflicts"
    | "course_no_eligible_options"
    | "constraint_eliminates_course"
    /** A whole-week rule (gaps, back-to-back labs, classes a day), or all the
     * time rules together, leave no week. */
    | "rule_blocks_all"
    /** Three or more courses clash as a group; no single pair is to blame. */
    | "courses_cant_all_fit";
  courseCodeA?: string;
  courseCodeB?: string;
  courseCodes?: string[];
  constraintLabel?: string;
  /** The pair only clashes because rules removed its other options. */
  fromRules?: boolean;
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
 * When neither fits, a small search names the rule or the courses to change
 * (pattern 3).
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
        // e.g. "No 8 AM" drops every B1 option, leaving both courses on B2.
        const fromRules = !courseA.options.every((optA) =>
          courseB.options.every((optB) => optionsOverlap(optA, optB, slotMap))
        );
        findings.push({
          type: "course_always_conflicts",
          courseCodeA: courseA.courseCode,
          courseCodeB: courseB.courseCode,
          fromRules,
          description: fromRules
            ? `${courseA.courseCode} and ${courseB.courseCode} clash${detail} only because your time rules removed their other slots.`
            : `${courseA.courseCode} and ${courseB.courseCode} always clash${detail} — every professor option overlaps.`,
          severity: "error",
        });
      }
    }
  }

  if (findings.length > 0) return findings;

  // ─── Pattern 3: no single course or pair is to blame ───
  // Take one thing out at a time and look for any valid week.
  const weekRules: Array<[string, Partial<Constraints>]> = [];
  const plural = (n: number, word: string, many: string) => `${n} ${n === 1 ? word : many}`;
  if (constraints.maxGapSlots !== null)
    weekRules.push([`At most ${plural(constraints.maxGapSlots, "gap", "gaps")}`, { maxGapSlots: null }]);
  if (constraints.noConsecutiveLabs)
    weekRules.push(["No back-to-back labs", { noConsecutiveLabs: false }]);
  if (constraints.maxClassesPerDay !== null)
    weekRules.push([`At most ${plural(constraints.maxClassesPerDay, "class", "classes")} a day`, { maxClassesPerDay: null }]);
  for (const [label, patch] of weekRules) {
    if (hasAnyWeek(courses, slots, { ...constraints, ...patch })) {
      findings.push({
        type: "rule_blocks_all",
        constraintLabel: label,
        description: `No week with these courses keeps to "${label}".`,
        severity: "error",
      });
    }
  }
  if (findings.length > 0) return findings;

  if (hasAnyWeek(courses, slots, defaultConstraints)) {
    return [{
      type: "rule_blocks_all",
      fromRules: true,
      description: "Each of your rules is fine on its own, but together they leave no clash-free week.",
      severity: "error",
    }];
  }

  const blockers = courses.filter(
    (course) => hasAnyWeek(courses.filter((other) => other !== course), slots, defaultConstraints)
  );
  if (blockers.length > 0) {
    const codes = blockers.map((course) => course.courseCode);
    const list = codes.length === 1 ? codes[0] : `${codes.slice(0, -1).join(", ")} and ${codes[codes.length - 1]}`;
    findings.push({
      type: "courses_cant_all_fit",
      courseCodes: codes,
      description: `${list} can't all fit in one week: every mix of their professors clashes somewhere.`,
      severity: "error",
    });
  }

  return findings;
}

// ponytail: step cap so the diagnosis can't freeze the page on a huge course
// list; past it we say nothing rather than guess. Move to the worker if it bites.
const SEARCH_STEPS = 50_000;

/** Whether at least one valid week exists, with the generator's hard rules.
 * null when the search hit SEARCH_STEPS before deciding. */
function hasAnyWeek(courses: Course[], slots: TimeSlot[], constraints: Constraints): boolean | null {
  const slotMap = indexSlots(slots);
  // Options with the same slots give the same answer, so keep one of each.
  const choices = courses
    .filter((course) => course.options.length > 0)
    .map((course) => {
      const bySlots = new Map<string, CourseOption>();
      for (const option of course.options) {
        if (violatesOptionHardConstraints(course, option, constraints, slotMap)) continue;
        bySlots.set(getOptionSlotIds(option).sort().join(","), option);
      }
      return { course, options: [...bySlots.values()] };
    })
    .sort((a, b) => a.options.length - b.options.length);

  let steps = 0;
  function search(index: number, picks: CourseOption[], used: string[]): boolean | null {
    if (++steps > SEARCH_STEPS) return null;
    if (index === choices.length) {
      if (constraints.maxGapSlots === null) return true;
      const selections = picks.map((option, i) => buildSelection(choices[i].course, option, slotMap));
      return computeScheduleMetrics(selections, slots).totalGapSlots <= constraints.maxGapSlots;
    }
    for (const option of choices[index].options) {
      if (conflictsWithExisting(option, used, slotMap)) continue;
      const next = [...used, ...getOptionSlotIds(option)];
      if (constraints.noConsecutiveLabs && hasConsecutiveLabs(next, slotMap)) continue;
      const limit = constraints.maxClassesPerDay;
      if (limit !== null && Object.values(classesPerDay(next, slotMap)).some((count) => count > limit)) continue;
      const found = search(index + 1, [...picks, option], next);
      if (found !== false) return found;
    }
    return false;
  }
  return search(0, [], []);
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

  for (const [day, time] of Object.entries(constraints.latestEndByDay)) {
    if (!time) continue;
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && slot.day === day && parseTime(slot.endTime) > parseTime(time);
      })
    );
    if (allViolate) return `End before ${time} on ${day}`;
  }

  for (const [day, time] of Object.entries(constraints.startAfterByDay)) {
    if (!time) continue;
    const allViolate = options.every((opt) =>
      getOptionSlotIds(opt).some((id) => {
        const slot = slotMap.get(id);
        return slot && slot.day === day && parseTime(slot.startTime) < parseTime(time);
      })
    );
    if (allViolate) return `Start after ${time} on ${day}`;
  }

  return "your current constraints";
}
