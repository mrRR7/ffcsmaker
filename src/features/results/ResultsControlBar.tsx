"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { cn } from "@/utils/cn";

type SortMode = "score" | "lowGaps" | "earlyFinish";

export function ResultsControlBar({
  count,
  sortMode,
  onSortModeChange,
  actions,
  className
}: {
  count: number;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/80 p-4 shadow-card backdrop-blur", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Results
            </p>
            <Badge className="border-primary/25 bg-primary/10 text-primary">
              {count} schedules
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Schedule Explorer
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Timetable-first browsing with compact comparisons and focused schedule inspection.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-3 xl:max-w-3xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={sortMode}
              onChange={(event) => onSortModeChange(event.target.value as SortMode)}
              className="sm:max-w-xs"
            >
              <option value="score">Best score</option>
              <option value="lowGaps">Lowest gaps</option>
              <option value="earlyFinish">Earliest finish</option>
            </Select>
            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            Jump through ranked timetables without losing the current view.
          </p>
        </div>
      </div>
    </div>
  );
}
