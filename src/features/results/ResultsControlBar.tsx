"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { cn } from "@/utils/cn";

type SortMode = "score" | "lowGaps" | "earlyFinish";

export function ResultsControlBar({
  schedulesCount,
  shapesCount,
  sortMode,
  onSortModeChange,
  actions,
  className
}: {
  schedulesCount: number;
  shapesCount: number;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/80 p-4 shadow-card backdrop-blur", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              Results
            </h1>
            <Badge variant="primary">
              {schedulesCount} schedules • {shapesCount} {shapesCount === 1 ? 'shape' : 'shapes'}
            </Badge>
          </div>
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
        </div>
      </div>
    </div>
  );
}
