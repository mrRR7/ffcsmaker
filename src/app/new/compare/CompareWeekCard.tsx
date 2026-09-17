"use client";

import toast from "react-hot-toast";
import { X } from "lucide-react";
import { Course, ScoredTimetable, TimeSlot } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPButton } from "@/components/fp-ui/button";
import { FPMetricRun } from "@/components/fp-ui/metric-run";
import { FPSlotMatrixTimetable } from "@/components/fp-ui/slot-matrix-timetable";
import { findFreeDay, getScheduleDayBlocks } from "./scheduleVisuals";
import { useCountUp } from "@/components/fp-ui/use-count-up";

export function CompareWeekCard({
  schedule,
  slots,
  courses,
  eyebrow,
  recommended,
  onRemove
}: {
  schedule: ScoredTimetable;
  slots: TimeSlot[];
  courses: Course[];
  eyebrow: string;
  recommended: boolean;
  onRemove: () => void;
}) {
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const displayedScore = useCountUp(schedule.score);

  const { days, blocksByDay } = getScheduleDayBlocks(schedule, slots, courses);
  const freeDay = findFreeDay(days, blocksByDay);
  const totalCredits = schedule.selections.reduce((sum, selection) => sum + selection.credits, 0);
  const gapCount = schedule.metrics.totalGapSlots;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-fp-bg-surface"
      style={{ borderColor: recommended ? "var(--border-accent)" : "var(--border-default)" }}
    >
      <div className="flex items-center gap-3 border-b border-fp-border-default p-4">
        <div>
          <div className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">{eyebrow}</div>
          <FPBadge tone={recommended ? "accent" : "neutral"} pill className="mt-1">
            {recommended ? "Recommended" : "Alternative"}
          </FPBadge>
        </div>
        <span
          className="ml-auto font-fp-mono text-[length:var(--text-title)]"
          style={{ color: recommended ? "var(--accent)" : "var(--text-strong)" }}
        >
          {Math.round(displayedScore)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from compare"
          className="-m-2 p-2 text-fp-text-dim hover:text-fp-warn"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="border-b border-fp-border-default p-3">
        <FPSlotMatrixTimetable schedule={schedule} slots={slots} courses={courses} showHeader={false} />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <FPMetricRun
          items={[
            freeDay ? `${freeDay.slice(0, 3)} free` : "No free day",
            `by ${schedule.metrics.latestEndTime}`,
            `${gapCount} gap${gapCount === 1 ? "" : "s"}`,
            `${totalCredits} credits`
          ]}
        />

        <div className="flex flex-col gap-1.5">
          {schedule.selections.map((selection) => {
            const course = courses.find((c) => c.id === selection.courseId);
            return (
              <div key={selection.courseId} className="flex items-center gap-2.5 text-[length:var(--text-small)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: course?.color ?? "var(--text-dim)" }}
                />
                <span className="font-fp-mono text-fp-text-strong">{selection.courseCode}</span>
                <span className="ml-auto truncate text-fp-text-dim">{selection.professorName}</span>
              </div>
            );
          })}
        </div>

        <FPButton
          variant={recommended ? "primary" : "secondary"}
          size="sm"
          className="w-full justify-center"
          onClick={() => {
            saveSchedule(schedule);
            toast.success("Week saved.");
          }}
        >
          Save this week
        </FPButton>
      </div>
    </article>
  );
}
