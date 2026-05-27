"use client";

import { ArrowLeft, ArrowRight, Heart, GitCompare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoredTimetable } from "@/engine/types";
import { cn } from "@/utils/cn";

export function ScheduleBrowser({
  schedules,
  activeSchedule,
  activeIndex,
  onSelectSchedule,
  onPrevious,
  onNext,
  onToggleFavorite,
  onAddCompare,
  isFavorite
}: {
  schedules: ScoredTimetable[];
  activeSchedule: ScoredTimetable;
  activeIndex: number;
  onSelectSchedule: (scheduleId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFavorite: (scheduleId: string) => void;
  onAddCompare: (scheduleId: string) => void;
  isFavorite: boolean;
}) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-card backdrop-blur">
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={onPrevious} disabled={activeIndex <= 0}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Schedule browser
            </p>
            <p className="text-sm text-muted-foreground">
              {activeIndex + 1} of {schedules.length} • Score {activeSchedule.score}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onNext} disabled={activeIndex >= schedules.length - 1}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {activeSchedule.metrics.totalGapSlots} gaps
          </Badge>
          <Badge>{activeSchedule.metrics.latestEndTime}</Badge>
          <Badge>{activeSchedule.metrics.freeDays} free days</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isFavorite ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFavorite(activeSchedule.id)}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            Favorite
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onAddCompare(activeSchedule.id)}>
            <GitCompare className="h-4 w-4" />
            Compare
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelectSchedule(schedules[activeIndex].id)}>
            Active #{activeIndex + 1}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BrowserRow({
  schedule,
  index,
  selected,
  onSelectSchedule,
  onToggleFavorite,
  onAddCompare,
  isFavorite
}: {
  schedule: ScoredTimetable;
  index: number;
  selected: boolean;
  onSelectSchedule: (scheduleId: string) => void;
  onToggleFavorite: (scheduleId: string) => void;
  onAddCompare: (scheduleId: string) => void;
  isFavorite: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectSchedule(schedule.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectSchedule(schedule.id);
        }
      }}
      className={cn(
        "w-full rounded-xl border px-3 py-3 text-left transition",
        selected
          ? "border-primary/35 bg-primary/5"
          : "border-border/70 bg-background/40 hover:bg-secondary/60",
        "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={cn("border-border/70", selected && "border-primary/25 bg-primary/10 text-primary")}>#{index + 1}</Badge>
            <p className="text-sm font-semibold text-foreground">Score {schedule.score}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {schedule.metrics.totalGapSlots} gaps • {schedule.metrics.activeDays} active days • ends {schedule.metrics.latestEndTime}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant={isFavorite ? "default" : "outline"}
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(schedule.id);
            }}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onAddCompare(schedule.id);
            }}
          >
            <GitCompare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
