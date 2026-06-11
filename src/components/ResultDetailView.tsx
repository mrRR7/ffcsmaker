// ResultDetailView component – reusable detailed view for schedules
// This component mirrors the read‑only version of the Results page, showing
// score, ranking mode, metrics, course summary, and the full timetable grid.
// It is used by the Shared Timetable page and can be imported by the
// Results and Compare pages to ensure UI consistency.

"use client";

import { ScheduleMetricsStrip } from "@/features/results/ScheduleMetricsStrip";
import { CourseSummaryPanel } from "@/features/results/CourseSummaryPanel";
import { SlotMatrixTimetable } from "@/features/results/SlotMatrixTimetable";
import { Badge } from "@/components/ui/badge";
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

// Props allow optional interactivity; defaults provide a read‑only view.
interface ResultDetailViewProps {
  snapshot: Snapshot;
  onCellClick?: (cell: any, anchor: DOMRect) => void;
  highlightCourseCode?: string | null;
  activeCellId?: string | null;
  activeBlockAnchor?: DOMRect | null;
}

export function ResultDetailView({
  snapshot,
  onCellClick = () => {},
  highlightCourseCode = null,
  activeCellId = null,
  activeBlockAnchor = null,
}: ResultDetailViewProps) {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header – score & ranking mode */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Shared Timetable</h1>
            <Badge>Snapshot</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date(snapshot.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div>
            <h2 className="text-base font-medium">
              Score {snapshot.score}
            </h2>
          </div>
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {snapshot.schedule.rankingMode}
          </Badge>
        </div>
      </div>

      {/* Metrics – using existing ScheduleMetricsStrip */}
      <ScheduleMetricsStrip schedule={snapshot.schedule} />

      {/* Course summary */}
      <CourseSummaryPanel
        schedule={snapshot.schedule}
        slots={snapshot.slots}
        courses={snapshot.courses}
        highlightCourseCode={null}
        previewCourseCode={null}
        onHighlightCourseCodeChange={() => {}}
        onPreviewCourseCodeChange={() => {}}
      />

      {/* Full timetable grid – can be interactive if handlers are provided */}
      <SlotMatrixTimetable
        schedule={snapshot.schedule}
        slots={snapshot.slots}
        courses={snapshot.courses}
        onCellClick={onCellClick}
        highlightCourseCode={highlightCourseCode}
        activeCellId={activeCellId}
      />
    </div>
  );
}
