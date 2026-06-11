"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoredTimetable } from "@/engine/types";
import { cn } from "@/utils/cn";

type SemanticState = "success" | "warning" | "error" | "primary" | "neutral";

function MetricPill({
  label,
  value,
  emphasis = false,
  semantic = "neutral"
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
  semantic?: SemanticState;
}) {
  return (
    <div
      className={cn(
        "min-w-[130px] rounded-xl border px-3 py-2",
        emphasis ? "min-w-[170px]" : "",
        semantic === "neutral" && "border-border/70 bg-background/55 text-foreground",
        semantic === "primary" && "border-primary/25 bg-primary/5 text-primary",
        semantic === "success" && "border-success/30 bg-success/10 text-success",
        semantic === "warning" && "border-warning/30 bg-warning/10 text-warning",
        semantic === "error" && "border-error/30 bg-error/10 text-error"
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className={cn("mt-1 font-semibold", emphasis && "text-base")}>
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

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-4">
      <div className="flex gap-2 overflow-x-auto">
        <MetricPill label="Score" value={schedule.score} emphasis semantic="primary" />
        <MetricPill label="Credits" value={totalCredits} emphasis />
        <MetricPill label="Half days" value={schedule.metrics.halfDays} />
        <MetricPill label="Earliest start" value={schedule.metrics.earliestStartTime} />
        <MetricPill label="Latest end" value={schedule.metrics.latestEndTime} />
      </div>
    </Card>
  );
}
