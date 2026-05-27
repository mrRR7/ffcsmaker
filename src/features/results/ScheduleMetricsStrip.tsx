"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoredTimetable } from "@/engine/types";
import { cn } from "@/utils/cn";

function MetricPill({
  label,
  value,
  emphasis = false
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-[130px] rounded-xl border border-border/70 bg-background/55 px-3 py-2",
        emphasis && "min-w-[170px] border-primary/25 bg-primary/5"
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 font-semibold text-foreground", emphasis && "text-base")}>
        {value}
      </p>
    </div>
  );
}

export function ScheduleMetricsStrip({ schedule }: { schedule: ScoredTimetable }) {
  const totalCredits = schedule.selections.reduce(
    (sum, selection) => sum + selection.credits,
    0
  );
  const professorNames = Array.from(
    new Set(schedule.selections.map((selection) => selection.professorName))
  );

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Active timetable metrics
          </p>
          <p className="text-sm text-muted-foreground">A compact scan line for the current schedule.</p>
        </div>
        <Badge className="border-primary/25 bg-primary/10 text-primary">
          {schedule.rankingMode}
        </Badge>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <MetricPill label="Score" value={schedule.score} emphasis />
        <MetricPill label="Free days" value={schedule.metrics.freeDays} emphasis />
        <MetricPill label="Latest end" value={schedule.metrics.latestEndTime} emphasis />
        <MetricPill label="Credits" value={totalCredits} />
        <MetricPill label="Active days" value={schedule.metrics.activeDays} />
        <MetricPill label="Half days" value={schedule.metrics.halfDays} />
        <MetricPill label="Gap slots" value={schedule.metrics.totalGapSlots} />
        <MetricPill label="Compactness" value={schedule.metrics.compactness} />
        <MetricPill label="Earliest start" value={schedule.metrics.earliestStartTime} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border/70 bg-background/50 px-3 py-1 font-medium text-foreground">
          {schedule.selections.length} selected courses
        </span>
        <span className="rounded-full border border-border/70 bg-background/50 px-3 py-1">
          Professors: {professorNames.slice(0, 4).join(" · ")}
          {professorNames.length > 4 ? ` +${professorNames.length - 4}` : ""}
        </span>
      </div>
    </Card>
  );
}
