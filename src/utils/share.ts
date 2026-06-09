import {
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



export async function createSharedTimetableUrl(snapshot: {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  metrics: ScoredTimetable["metrics"];
  score: number;
  generatedAt: string;
  appVersion?: string;
}) {
  if (typeof window === "undefined") return "";
  
  const resp = await fetch("/api/share-timetable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot })
  });
  
  if (!resp.ok) {
    throw new Error("Failed to share timetable");
  }
  
  const json = await resp.json();
  if (!json?.id) {
    throw new Error("Invalid response from server");
  }
  
  return `${window.location.origin}/timetable/${json.id}`;
}
