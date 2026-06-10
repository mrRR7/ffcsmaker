"use client";

import { ResultDetailView } from "@/components/ResultDetailView";
import { ScoredTimetable, TimeSlot, Course } from "@/engine/types";

interface Snapshot {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  metrics: ScoredTimetable["metrics"];
  score: number;
  generatedAt: string;
  appVersion?: string;
}

export function SharedTimetableView({ snapshot }: { snapshot: Snapshot }) {
  return <ResultDetailView snapshot={snapshot} />;
}
