"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Course, ScoredTimetable } from "@/engine/types";
import { MatrixCell } from "./timetableMatrix";
import { cn } from "@/utils/cn";

function formatSlotTime(cell: MatrixCell) {
  if (!cell.startTime || !cell.endTime) {
    return "Open slot";
  }
  return `${cell.startTime} - ${cell.endTime}`;
}

export function BlockDetailPanel({
  block,
  schedule,
  courses,
  onClose,
  anchorRect,
  mode = "selected"
}: {
  block: MatrixCell | null;
  schedule: ScoredTimetable | null;
  courses: Course[];
  onClose: () => void;
  anchorRect?: DOMRect | null;
  mode?: "selected" | "preview";
}) {
  const details = useMemo(() => {
    if (!block) {
      return null;
    }
    if (!block.occupied || !schedule || !block.courseId) {
      return {
        empty: true as const,
        slot: block
      };
    }

    const selection = schedule.selections.find((item) => item.courseId === block.courseId);
    const course = courses.find((item) => item.id === block.courseId);
    const option = course?.options.find((item) => item.id === selection?.optionId);

    return {
      selection,
      course,
      option,
      empty: false as const
    };
  }, [block, courses, schedule]);

  if (!block || !details) {
    return null;
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const panelWidth = 360;
  const desktopLeft = anchorRect
    ? Math.max(12, Math.min(anchorRect.left, (typeof window !== "undefined" ? window.innerWidth : 0) - panelWidth - 12))
    : 12;
  const desktopTop = anchorRect ? Math.max(12, anchorRect.bottom + 12) : 12;

  const sharedHeader = (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: block.color }} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {mode === "preview" ? "Hover preview" : "Selected slot"}
        </p>
      </div>
      <CardTitle className="text-base">
        {details.empty ? `${block.day} ${block.track}` : details.selection?.courseName}
      </CardTitle>
    </div>
  );

  return (
    <>
      <Card
        className="hidden overflow-hidden border-border/70 bg-card/95 shadow-2xl shadow-black/10 backdrop-blur md:block md:z-30"
        style={
          anchorRect
            ? { position: "fixed", top: desktopTop, left: desktopLeft, width: panelWidth }
            : { position: "fixed", top: 12, left: 12, width: panelWidth }
        }
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-3">
          {sharedHeader}
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {details.empty ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{block.track}</Badge>
                <Badge>{block.day}</Badge>
                <Badge>{formatSlotTime(block)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                This slot is currently unassigned in the active timetable.
              </p>
              <p className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground">
                {block.slotLabel || "Open slot"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/25 bg-primary/10 text-primary">
                  {details.selection?.courseCode}
                </Badge>
                <Badge className="border-primary/25 bg-primary/10 text-primary">
                  {details.selection?.courseName}
                </Badge>
                <Badge>{details.selection?.professorName}</Badge>
                <Badge>{block.typeLabel ?? block.track}</Badge>
                <Badge>{details.selection?.credits} credits</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Course:</span> {details.selection?.courseCode} {details.selection?.courseName}
                </p>
                <p>
                  <span className="font-medium text-foreground">Day:</span> {block.day}
                </p>
                <p>
                  <span className="font-medium text-foreground">Time:</span> {formatSlotTime(block)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Slot IDs:</span> {block.slotIds.join(", ")}
                </p>
                <p>
                  <span className="font-medium text-foreground">Theory / Lab:</span> {details.selection?.theorySlotIds.length ? `Theory ${details.selection.theorySlotIds.length}` : "-"} / {details.selection?.labSlotIds.length ? `Lab ${details.selection.labSlotIds.length}` : "-"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Course notes
                </p>
                <p className={cn("rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground", !details.option?.notes && "italic") }>
                  {details.option?.notes || "No extra notes for this selection."}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="fixed inset-x-3 bottom-3 z-40 overflow-hidden border-border/70 bg-card/95 shadow-2xl shadow-black/20 backdrop-blur md:hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-3">
          {sharedHeader}
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
          {details.empty ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{block.track}</Badge>
                <Badge>{block.day}</Badge>
                <Badge>{formatSlotTime(block)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                This slot is currently unassigned in the active timetable.
              </p>
              <p className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground">
                {block.slotLabel || "Open slot"}
              </p>
            </div>
          ) : (
            <>
              <p className="font-semibold text-foreground">
                {details.selection?.courseCode} {details.selection?.courseName}
              </p>
              <p className="text-sm text-muted-foreground">{details.selection?.professorName}</p>
              <div className="flex flex-wrap gap-2">
                <Badge>{block.typeLabel ?? block.track}</Badge>
                <Badge>{details.selection?.credits} credits</Badge>
                <Badge>{block.day}</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p>Time: {formatSlotTime(block)}</p>
                <p>Slot IDs: {block.slotIds.join(", ")}</p>
              </div>
              <p className={cn("rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground", !details.option?.notes && "italic") }>
                {details.option?.notes || "No extra notes for this selection."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
