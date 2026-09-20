import { nanoid } from "nanoid";
import {
  Course,
  CourseOption,
  GeneratePayload,
  ScoredTimetable,
  TimeSlot,
  TimetableSelection
} from "./types";
import {
  buildSelection,
  classesPerDay,
  conflictsWithExisting,
  getOptionSlotIds,
  indexSlots,
  violatesOptionHardConstraints
} from "./conflict";
import { computeScheduleMetrics } from "./metrics";
import { scoreSchedule } from "./ranking";

type ProgressCallback = (progress: {
  checked: number;
  accepted: number;
  progress: number;
}) => void;

function hasCompleteHardViolations(
  selections: TimetableSelection[],
  slots: TimeSlot[],
  payload: GeneratePayload
) {
  const metrics = computeScheduleMetrics(selections, slots);
  const { constraints } = payload;

  if (
    constraints.maxGapSlots !== null &&
    metrics.totalGapSlots > constraints.maxGapSlots
  ) {
    return true;
  }

  return false;
}

function optionScoreHint(course: Course, option: CourseOption) {
  return option.theorySlotIds.length + option.labSlotIds.length + course.credits;
}

function priorityScore(
  selections: TimetableSelection[],
  courses: Course[],
  enabled?: boolean
) {
  if (!enabled || courses.length === 0 || selections.length === 0) {
    return 0;
  }

  const raw = selections.reduce((sum, selection) => {
    const courseIndex = courses.findIndex((course) => course.id === selection.courseId);
    const course = courses[courseIndex];
    if (!course) {
      return sum;
    }
    const optionIndex = course.options.findIndex(
      (option) => option.id === selection.optionId
    );
    const courseWeight = (courses.length - courseIndex) / courses.length;
    const optionWeight =
      optionIndex >= 0
        ? (course.options.length - optionIndex) / Math.max(1, course.options.length)
        : 0;
    return sum + courseWeight * optionWeight;
  }, 0);

  return Number(((raw / selections.length) * 15).toFixed(1));
}

export function generateTimetables(
  payload: GeneratePayload,
  onProgress?: ProgressCallback
): { schedules: ScoredTimetable[]; checked: number; capped: boolean } {
  const { courses, slots, constraints, rankingMode } = payload;
  const maxResults = payload.maxResults ?? 500;
  const slotMap = indexSlots(slots);
  const schedules: ScoredTimetable[] = [];
  let checked = 0;
  let lastProgressEmit = 0;

  // Hard wall-clock ceiling on the search. Without this, a large course
  // list with loose constraints can walk a huge fraction of the
  // combinatorial tree before concluding "few/no results" — the worker
  // stays responsive (progress keeps updating), but the user is left
  // watching a slow-moving bar with no end in sight. Past this budget we
  // stop and return whatever was found so far, flagged as capped.
  const TIME_BUDGET_MS = 8000;
  const startedAt = Date.now();
  let dfsCalls = 0;
  let timeExceeded = false;

  function timeBudgetExceeded() {
    if (timeExceeded) {
      return true;
    }
    dfsCalls += 1;
    // Date.now() is cheap, but skip most calls anyway on very deep/wide
    // searches so the check itself never becomes the bottleneck.
    if (dfsCalls % 500 === 0 && Date.now() - startedAt > TIME_BUDGET_MS) {
      timeExceeded = true;
    }
    return timeExceeded;
  }

  const orderedCourses = [...courses]
    .filter((course) => course.options.length > 0)
    .sort((a, b) => a.options.length - b.options.length);

  const estimatedBranches = Math.max(
    1,
    orderedCourses.reduce(
      (product, course) => product * Math.max(1, course.options.length),
      1
    )
  );

  function emitProgress(force = false) {
    if (!onProgress) {
      return;
    }
    const now = Date.now();
    if (!force && now - lastProgressEmit < 120) {
      return;
    }
    lastProgressEmit = now;
    onProgress({
      checked,
      accepted: schedules.length,
      progress: Math.min(99, (checked / estimatedBranches) * 100)
    });
  }

  function dfs(
    courseIndex: number,
    selections: TimetableSelection[],
    selectedSlotIds: string[]
  ) {
    if (schedules.length >= maxResults || timeBudgetExceeded()) {
      return;
    }

    if (courseIndex >= orderedCourses.length) {
      checked += 1;
      if (!hasCompleteHardViolations(selections, slots, payload)) {
        const metrics = computeScheduleMetrics(selections, slots);
        const { score, scoreBreakdown, rawFacultyScore } = scoreSchedule(
          metrics,
          selections,
          rankingMode,
          constraints
        );
        metrics.facultyMatchPercentage = Math.max(0, Math.min(100, Math.round(rawFacultyScore * 100)));

        const priority = priorityScore(
          selections,
          courses,
          payload.usePriorityRanking
        );
        schedules.push({
          id: nanoid(),
          selections: [...selections],
          metrics,
          score: Number((score + priority).toFixed(1)),
          rankingMode,
          scoreBreakdown:
            priority > 0 ? { ...scoreBreakdown, priority } : scoreBreakdown
        });
      }
      emitProgress();
      return;
    }

    const course = orderedCourses[courseIndex];
    const options = [...course.options].sort(
      (a, b) => optionScoreHint(course, b) - optionScoreHint(course, a)
    );

    for (const option of options) {
      if (
        violatesOptionHardConstraints(course, option, constraints, slotMap) ||
        conflictsWithExisting(option, selectedSlotIds, slotMap)
      ) {
        checked += 1;
        emitProgress();
        continue;
      }

      const nextSlotIds = [...selectedSlotIds, ...getOptionSlotIds(option)];
      if (constraints.maxClassesPerDay !== null) {
        const counts = classesPerDay(nextSlotIds, slotMap);
        if (
          Object.values(counts).some(
            (count) => count > Number(constraints.maxClassesPerDay)
          )
        ) {
          checked += 1;
          emitProgress();
          continue;
        }
      }

      const selection = buildSelection(course, option, slotMap);
      dfs(courseIndex + 1, [...selections, selection], nextSlotIds);
    }
  }

  dfs(0, [], []);
  
  // Initial sort by score
  schedules.sort((a, b) => b.score - a.score);
  
  emitProgress(true);

  return {
    schedules,
    checked,
    capped: timeExceeded
  };
}
