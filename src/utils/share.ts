import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent
} from "lz-string";
import {
  Constraints,
  Course,
  RankingMode,
  ScoredTimetable,
  SharedPlannerState,
  TimeSlot
} from "@/engine/types";

export function createSharedState(input: {
  slots: TimeSlot[];
  courses: Course[];
  constraints: Constraints;
  rankingMode: RankingMode;
  usePriorityRanking?: boolean;
  activeSchedule?: ScoredTimetable | null;
}): SharedPlannerState {
  return {
    version: 1,
    slots: input.slots,
    courses: input.courses,
    constraints: input.constraints,
    rankingMode: input.rankingMode,
    usePriorityRanking: input.usePriorityRanking,
    activeSchedule: input.activeSchedule ?? null
  };
}

export function encodeSharedState(state: SharedPlannerState) {
  return compressToEncodedURIComponent(JSON.stringify(state));
}

export function decodeSharedState(encoded: string): SharedPlannerState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) {
      return null;
    }
    const parsed = JSON.parse(json) as SharedPlannerState;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function buildShareUrl(pathname: string, encoded: string) {
  if (typeof window === "undefined") {
    return "";
  }
  const url = new URL(pathname, window.location.origin);
  url.searchParams.set("share", encoded);
  return url.toString();
}
