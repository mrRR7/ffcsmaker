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

function priorityScore(
  selections: TimetableSelection[],
  courses: Course[]
) {
  if (courses.length === 0 || selections.length === 0) {
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

  return raw / selections.length;
}

type SampleCallback = (selections: TimetableSelection[]) => void;

// How many accepted schedules are reported to `onSample`. Bounded, so the
// callback needs no throttling; the UI uses these to show real valid weeks
// while the search runs.
const MAX_SAMPLES = 8;

export function generateTimetables(
  payload: GeneratePayload,
  onProgress?: ProgressCallback,
  onSample?: SampleCallback
): { schedules: ScoredTimetable[]; checked: number; capped: boolean } {
  const { courses, slots, constraints, rankingMode } = payload;
  const maxResults = payload.maxResults ?? 500;
  const slotMap = indexSlots(slots);
  let checked = 0;
  let lastProgressEmit = 0;
  let samplesSent = 0;

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

  // Options with identical slots make identical weeks, so the search runs over
  // these slot groups: every week layout is found and ranked, instead of the
  // result cap filling up with professor permutations of the first layout found.
  // Professors are expanded per layout afterwards.
  const orderedCourses = courses
    .filter((course) => course.options.length > 0)
    .map((course) => {
      const groups = new Map<string, CourseOption[]>();
      for (const option of course.options) {
        if (violatesOptionHardConstraints(course, option, constraints, slotMap)) {
          continue;
        }
        const key = getOptionSlotIds(option).sort().join(",");
        groups.set(key, [...(groups.get(key) ?? []), option]);
      }
      return { course, groups: [...groups.values()] };
    })
    .sort((a, b) => a.groups.length - b.groups.length);

  const estimatedBranches = Math.max(
    1,
    orderedCourses.reduce((product, { groups }) => product * Math.max(1, groups.length), 1)
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
      accepted: layouts.length,
      progress: Math.min(99, (checked / estimatedBranches) * 100)
    });
  }

  function scored(picks: CourseOption[]): ScoredTimetable {
    const selections = picks.map((option, i) => buildSelection(orderedCourses[i].course, option, slotMap));
    const metrics = computeScheduleMetrics(selections, slots);
    const { score, scoreBreakdown, rawFacultyScore } = scoreSchedule(
      metrics,
      selections,
      rankingMode,
      constraints,
      payload.usePriorityRanking ? priorityScore(selections, courses) : null
    );
    metrics.facultyMatchPercentage = Math.max(0, Math.min(100, Math.round(rawFacultyScore * 100)));
    return { id: nanoid(), selections, metrics, score, rankingMode, scoreBreakdown };
  }

  type Layout = { groups: CourseOption[][]; base: ScoredTimetable };
  const layouts: Layout[] = [];
  const byScore = (a: Layout, b: Layout) => b.base.score - a.base.score;

  function dfs(courseIndex: number, picked: CourseOption[][], selectedSlotIds: string[]) {
    if (timeBudgetExceeded()) {
      return;
    }

    if (courseIndex >= orderedCourses.length) {
      checked += 1;
      const base = scored(picked.map((group) => group[0]));
      if (constraints.maxGapSlots === null || base.metrics.totalGapSlots <= constraints.maxGapSlots) {
        layouts.push({ groups: picked, base });
        // Keep memory bounded on huge searches: only the best layouts survive.
        if (layouts.length >= 4 * maxResults) {
          layouts.sort(byScore);
          layouts.length = maxResults;
        }
        if (onSample && samplesSent < MAX_SAMPLES) {
          samplesSent += 1;
          onSample(base.selections);
        }
      }
      emitProgress();
      return;
    }

    for (const group of orderedCourses[courseIndex].groups) {
      // Every option in a group has the same slots, so the first speaks for all.
      const option = group[0];
      if (conflictsWithExisting(option, selectedSlotIds, slotMap)) {
        checked += 1;
        emitProgress();
        continue;
      }

      const nextSlotIds = [...selectedSlotIds, ...getOptionSlotIds(option)];
      if (constraints.maxClassesPerDay !== null) {
        const counts = classesPerDay(nextSlotIds, slotMap);
        if (Object.values(counts).some((count) => count > Number(constraints.maxClassesPerDay))) {
          checked += 1;
          emitProgress();
          continue;
        }
      }

      dfs(courseIndex + 1, [...picked, group], nextSlotIds);
    }
  }

  dfs(0, [], []);

  layouts.sort(byScore);
  // A fifth of the cap for layouts, the rest for professor swaps on them.
  const kept = layouts.slice(0, Math.ceil(maxResults / 5));
  const schedules = kept.map((layout) => layout.base);
  // Then one-professor swaps off each layout's base, best layouts first, until
  // the cap: enough for Swap to offer every professor a layout allows.
  // ponytail: a pick that changes two courses at once isn't precomputed; build
  // variants on demand in Swap if people need arbitrary combinations.
  fill: for (const layout of kept) {
    for (let i = 0; i < layout.groups.length; i += 1) {
      for (const option of layout.groups[i].slice(1)) {
        if (schedules.length >= maxResults) {
          break fill;
        }
        const picks = layout.groups.map((group) => group[0]);
        picks[i] = option;
        schedules.push(scored(picks));
      }
    }
  }

  schedules.sort((a, b) => b.score - a.score);

  emitProgress(true);

  return {
    schedules,
    checked,
    capped: timeExceeded
  };
}
