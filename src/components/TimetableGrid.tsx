"use client";

import { Course, DAYS, ScoredTimetable, TimeSlot } from "@/engine/types";
import {
  formatDuration,
  getSlotsForSelection,
  parseTime
} from "@/engine/conflict";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type Block = {
  id: string;
  day: string;
  start: number;
  end: number;
  label: string;
  professor: string;
  courseName: string;
  slotLabel: string;
  type: "Theory" | "Lab";
  color: string;
};

function buildBlocks(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  courses: Course[]
): Block[] {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const courseMap = new Map(courses.map((course) => [course.id, course]));

  return schedule.selections.flatMap((selection) => {
    const course = courseMap.get(selection.courseId);
    const slotTypeById = new Map<string, Block["type"]>();
    selection.theorySlotIds.forEach((slotId) => slotTypeById.set(slotId, "Theory"));
    selection.labSlotIds.forEach((slotId) => slotTypeById.set(slotId, "Lab"));

    return getSlotsForSelection(selection, slotMap).map((slot) => ({
      id: `${selection.optionId}-${slot.id}`,
      day: slot.day,
      start: parseTime(slot.startTime),
      end: parseTime(slot.endTime),
      label: selection.courseCode,
      professor: selection.professorName,
      courseName: selection.courseName,
      slotLabel: `${slot.label} ${slot.startTime}-${slot.endTime}`,
      type: slotTypeById.get(slot.id) ?? (slot.kind === "lab" ? "Lab" : "Theory"),
      color: course?.color ?? "#14b8a6"
    }));
  });
}

export function TimetableGrid({
  schedule,
  slots,
  courses,
  className,
  compact = false
}: {
  schedule: ScoredTimetable | null;
  slots: TimeSlot[];
  courses: Course[];
  className?: string;
  compact?: boolean;
}) {
  if (!schedule) {
    return (
      <Card
        className={cn(
          "flex min-h-80 items-center justify-center p-8 text-center",
          className
        )}
      >
        <div>
          <p className="text-lg font-semibold">No schedule selected</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Generate schedules in the planner or reopen one from saved timetables.
          </p>
        </div>
      </Card>
    );
  }

  const blocks = buildBlocks(schedule, slots, courses);
  const starts = blocks.map((block) => block.start);
  const ends = blocks.map((block) => block.end);
  const startMinute = starts.length
    ? Math.max(7 * 60, Math.floor(Math.min(...starts) / 60) * 60)
    : 8 * 60;
  const endMinute = ends.length
    ? Math.min(21 * 60, Math.ceil(Math.max(...ends) / 60) * 60)
    : 20 * 60;
  const totalMinutes = Math.max(60, endMinute - startMinute);
  const hours = Array.from(
    { length: Math.floor(totalMinutes / 60) + 1 },
    (_, index) => startMinute + index * 60
  );
  const bodyHeight = compact ? 420 : Math.max(560, (totalMinutes / 60) * 78);
  const totalCredits = schedule.selections.reduce(
    (sum, selection) => sum + selection.credits,
    0
  );

  return (
    <Card className={cn("overflow-hidden bg-card/95", className)}>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/25 bg-primary/10 text-primary">
              Score {schedule.score}
            </Badge>
            <Badge>{schedule.rankingMode}</Badge>
            <Badge>{totalCredits} credits</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {schedule.metrics.totalClasses} classes - {schedule.metrics.totalGapSlots} gap
            slots ({formatDuration(schedule.metrics.totalGapHours)}) - ends{" "}
            {schedule.metrics.latestEndTime}
          </p>
        </div>
      </div>
      <div className="timetable-scroll overflow-x-auto">
        <div className="min-w-[960px] p-4">
          <div
            className="grid rounded-md border border-border bg-background/40"
            style={{
              gridTemplateColumns: `72px repeat(${DAYS.length}, minmax(140px, 1fr))`
            }}
          >
            <div className="border-b border-r border-border bg-secondary/40 p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Time
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="border-b border-r border-border bg-secondary/40 p-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0"
              >
                {day.slice(0, 3)}
              </div>
            ))}
            <div
              className="relative border-r border-border bg-background/20"
              style={{ height: bodyHeight }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 -translate-y-2 px-2 text-xs text-muted-foreground"
                  style={{ top: `${((hour - startMinute) / totalMinutes) * 100}%` }}
                >
                  {`${String(Math.floor(hour / 60)).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="relative border-r border-border bg-background/20 last:border-r-0"
                style={{ height: bodyHeight }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: `${((hour - startMinute) / totalMinutes) * 100}%` }}
                  />
                ))}
                {blocks
                  .filter((block) => block.day === day)
                  .map((block) => {
                    const top = ((block.start - startMinute) / totalMinutes) * 100;
                    const height = ((block.end - block.start) / totalMinutes) * 100;
                    return (
                      <div
                        key={block.id}
                        className="absolute left-2 right-2 overflow-hidden rounded-md border border-white/20 p-2 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-glow"
                        style={{
                          top: `${top}%`,
                          height: `max(${height}%, 54px)`,
                          background: `linear-gradient(145deg, ${block.color}, ${block.color}bb)`
                        }}
                        title={`${block.courseName} with ${block.professor}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {block.label}
                          </span>
                          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold">
                            {block.type}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-white/86">
                          {block.professor}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-white/75">
                          {block.slotLabel}
                        </p>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
