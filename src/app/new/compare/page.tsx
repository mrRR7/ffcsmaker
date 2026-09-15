"use client";

import { useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ScoredTimetable } from "@/engine/types";
import { getAllSchedules, useAppStore } from "@/store/useAppStore";
import { exportScheduleJson } from "@/utils/export";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPCard } from "@/components/fp-ui/card";
import { CompareWeekCard } from "./CompareWeekCard";
import { computeDiffs } from "./diffs";

const RANK_EYEBROWS = ["Best overall", "Runner-up", "Third pick"];

export default function NewComparePage() {
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const compareScheduleIdsRaw = useAppStore((state) => state.compareScheduleIds);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const removeCompareSchedule = useAppStore((state) => state.removeCompareSchedule);
  const clearCompare = useAppStore((state) => state.clearCompare);
  const savedSchedulesRaw = useAppStore((state) => state.savedSchedules);
  const generatedSchedulesRaw = useAppStore((state) => state.generatedSchedules);

  const compareScheduleIds = Array.isArray(compareScheduleIdsRaw) ? compareScheduleIdsRaw : [];
  const savedSchedules = Array.isArray(savedSchedulesRaw) ? savedSchedulesRaw : [];
  const generatedSchedules = Array.isArray(generatedSchedulesRaw) ? generatedSchedulesRaw : [];

  const allSchedules = useMemo(
    () => getAllSchedules({ generatedSchedules, savedSchedules }),
    [generatedSchedules, savedSchedules]
  );

  const selected = useMemo(() => {
    const found = compareScheduleIds
      .map((id) => allSchedules.find((schedule) => schedule.id === id))
      .filter((schedule): schedule is ScoredTimetable => Boolean(schedule))
      .slice(0, 3);
    return [...found].sort((a, b) => b.score - a.score);
  }, [compareScheduleIds, allSchedules]);

  const diffs = useMemo(() => computeDiffs(selected, slots, courses), [selected, slots, courses]);

  const headline =
    selected.length === 3
      ? "Three weeks, side by side"
      : selected.length === 2
        ? "Two weeks, side by side"
        : selected.length === 1
          ? "One week, on its own"
          : "Pick weeks to compare";

  function swapAWeek() {
    const next = allSchedules.find((schedule) => !compareScheduleIds.includes(schedule.id));
    if (!next) {
      toast.error("No other weeks left to swap in.");
      return;
    }
    addCompareSchedule(next.id);
  }

  function exportAll() {
    if (selected.length === 0) {
      toast.error("Nothing selected to export.");
      return;
    }
    selected.forEach((schedule) => exportScheduleJson(schedule));
    toast.success(`Exported ${selected.length} week${selected.length === 1 ? "" : "s"}.`);
  }

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <div className="flex items-center justify-end border-b border-fp-border-default px-7 py-3">
        <span className="font-fp-mono text-[11px] text-fp-text-dim">
          {selected.length} of {allSchedules.length} week{allSchedules.length === 1 ? "" : "s"} selected &middot; max 3
        </span>
      </div>

      <section className="px-7 pb-4 pt-7">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <h1 className="font-fp-display text-[34px] font-bold tracking-[-0.01em] text-fp-text-strong">{headline}</h1>
            <p className="mt-1.5 max-w-xl text-[15px] text-fp-text-body">
              {allSchedules.length === 0
                ? "Generate a few weeks in the planner, then bring them here to compare."
                : "Pick from your generated and saved weeks below to see exactly where they differ."}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) addCompareSchedule(event.target.value);
              }}
              className="fp-label h-full rounded-[var(--radius-md)] border border-fp-border-strong bg-transparent px-3 py-[7px] text-[11px] text-fp-text-body hover:border-fp-accent"
            >
              <option value="">Add a week</option>
              {allSchedules.map((schedule, index) => (
                <option key={schedule.id} value={schedule.id}>
                  #{index + 1} &middot; score {schedule.score}
                </option>
              ))}
            </select>
            <FPButton variant="secondary" size="sm" onClick={swapAWeek}>
              Swap a week
            </FPButton>
            <FPButton variant="secondary" size="sm" onClick={exportAll}>
              Export all
            </FPButton>
            <FPButton variant="ghost" size="sm" onClick={clearCompare}>
              Clear
            </FPButton>
          </div>
        </div>

        {diffs.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-5 rounded-[6px] border border-fp-border-default bg-fp-bg-surface px-4 py-3">
            <FPLabel>What differs</FPLabel>
            {diffs.map((diff) => (
              <span key={diff.label} className="text-[13px] text-fp-text-body">
                {diff.label} &middot;{" "}
                <span className="font-fp-mono text-[12px] text-fp-text-dim">{diff.values.join(" / ")}</span>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {allSchedules.length === 0 ? (
        <div className="px-7 pb-10">
          <FPCard className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <p className="font-fp-display text-[19px] font-bold text-fp-text-strong">No weeks to compare yet</p>
            <p className="max-w-sm text-[13px] text-fp-text-dim">
              Generate schedules in the planner, then add them here.
            </p>
            <Link href="/new/planner" className="mt-2 inline-block">
              <FPButton variant="primary" size="sm">
                Open planner
              </FPButton>
            </Link>
          </FPCard>
        </div>
      ) : selected.length === 0 ? (
        <div className="px-7 pb-10">
          <FPCard className="flex min-h-56 flex-col items-center justify-center gap-2 text-center">
            <p className="font-fp-display text-[17px] font-bold text-fp-text-strong">Nothing selected</p>
            <p className="max-w-sm text-[13px] text-fp-text-dim">Choose up to three weeks from the selector above.</p>
          </FPCard>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-7 pb-10">
          {selected.map((schedule, index) => (
            <CompareWeekCard
              key={schedule.id}
              schedule={schedule}
              slots={slots}
              courses={courses}
              eyebrow={RANK_EYEBROWS[index] ?? "Alternative"}
              recommended={index === 0}
              onRemove={() => removeCompareSchedule(schedule.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
