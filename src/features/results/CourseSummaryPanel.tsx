"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Course, ScoredTimetable, TimeSlot } from "@/engine/types";
import { getSlotsForSelection, indexSlots } from "@/engine/conflict";
import { cn } from "@/utils/cn";

function formatSlots(slotIds: string[], slots: Map<string, TimeSlot>) {
  return slotIds
    .map((slotId) => slots.get(slotId))
    .filter((slot): slot is TimeSlot => Boolean(slot))
    .map((slot) => `${slot.label} ${slot.startTime}-${slot.endTime}`)
    .join(", ");
}

export function CourseSummaryPanel({
  schedule,
  slots,
  courses,
  highlightCourseCode,
  previewCourseCode,
  onHighlightCourseCodeChange,
  onPreviewCourseCodeChange
}: {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  highlightCourseCode: string | null;
  previewCourseCode: string | null;
  onHighlightCourseCodeChange: (courseCode: string | null) => void;
  onPreviewCourseCodeChange: (courseCode: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const slotMap = useMemo(() => indexSlots(slots), [slots]);

  const rows = useMemo(
    () =>
      schedule.selections.map((selection) => {
        const course = courses.find((item) => item.id === selection.courseId);
        const typeLabel =
          selection.theorySlotIds.length > 0 && selection.labSlotIds.length > 0
            ? "Both"
            : selection.labSlotIds.length > 0
              ? "Lab"
              : "Theory";
        return {
          selection,
          course,
          typeLabel,
          theorySlots: formatSlots(selection.theorySlotIds, slotMap),
          labSlots: formatSlots(selection.labSlotIds, slotMap),
          combinedSlots: getSlotsForSelection(selection, slotMap)
            .map((slot) => `${slot.day.slice(0, 3)} ${slot.startTime}-${slot.endTime}`)
            .join(", ")
        };
      }),
    [courses, schedule.selections, slotMap]
  );

  const visibleRows = expanded ? rows : rows.slice(0, 3);

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Course summary
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {schedule.selections.length} selected courses, {rows.length} rows in view.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Collapse" : `Show ${rows.length - 3 > 0 ? `${rows.length - 3} more` : "all"}`}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleRows.map(({ selection, course, typeLabel, theorySlots, labSlots, combinedSlots }) => {
          const courseCode = selection.courseCode;
          const isHighlighted =
            highlightCourseCode === courseCode || previewCourseCode === courseCode;

          return (
            <button
              type="button"
              key={selection.courseId}
              onClick={() =>
                onHighlightCourseCodeChange(highlightCourseCode === courseCode ? null : courseCode)
              }
              onMouseEnter={() => onPreviewCourseCodeChange(courseCode)}
              onMouseLeave={() => onPreviewCourseCodeChange(null)}
              className={cn(
                "w-full rounded-xl border px-3 py-3 text-left transition",
                isHighlighted
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/70 bg-background/40 hover:bg-secondary/60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: course?.color ?? "#14b8a6" }}
                    />
                    <p className="truncate font-semibold text-foreground">
                      {selection.courseCode}
                    </p>
                    <Badge className="border-border/70 bg-secondary/70">{typeLabel}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {selection.courseName} • {selection.professorName}
                  </p>
                </div>
                <Badge className="border-primary/25 bg-primary/10 text-primary">
                  {selection.credits} credits
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span className="rounded-lg border border-border/60 bg-background/50 px-2 py-1">
                  Theory: {theorySlots || "—"}
                </span>
                <span className="rounded-lg border border-border/60 bg-background/50 px-2 py-1">
                  Lab: {labSlots || "—"}
                </span>
                <span className="rounded-lg border border-border/60 bg-background/50 px-2 py-1">
                  Slots: {combinedSlots || "—"}
                </span>
              </div>
            </button>
          );
        })}
        {!expanded && rows.length > 3 ? (
          <p className="px-1 text-xs text-muted-foreground">
            Showing 3 of {rows.length} courses. Expand to inspect slot allocation.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
