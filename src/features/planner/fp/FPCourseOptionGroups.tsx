"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { TimeSlot } from "@/engine/types";
import { DBCourseOption } from "@/types/db";
import { parseTime } from "@/engine/conflict";
import { resolveLabSlotIds, resolveTheorySlotIds } from "@/features/import/normalizeImport";
import { cn } from "@/utils/cn";
import { FPLabel } from "@/components/fp-ui/label";

/**
 * Grouping/filtering helpers for the Search tab's per-course professor-option
 * list (FPSearchTab.tsx). Two ideas from the user, combined:
 *
 * 1. Options are grouped into collapsed chips by their exact resolved theory
 *    slot signature (e.g. "A1 + TA1") instead of one flat list — this is what
 *    actually cuts the scroll, and it makes the "same course, different slot
 *    for a different branch" case (CourseOption.program) visible as distinct
 *    groups instead of unexplained duplicate rows.
 * 2. An optional, per-course Morning/Afternoon toggle narrows which chips
 *    show — defaulting to "All" so nothing is ever hidden unless a student
 *    asks for it, and scoped to one course card so a hosteler can pick
 *    Morning for one course and Afternoon for another independently.
 *
 * Classification uses each slot's REAL start time (via the existing
 * `resolveTheorySlotIds` resolver), not label-pattern matching — tutorial
 * slots (TA1, TAA1...) and soft-slots (S1-S15) don't match a simple
 * "letter + 1/2" regex but do have real, resolvable clock times.
 */

export type TimeOfDay = "morning" | "afternoon" | "unscheduled";
export type TimeOfDayFilter = "all" | "morning" | "afternoon";

// Matches the standard catalog's actual lunch gap (~13:00-14:00) seen in
// slotCatalog.ts — the boundary between a "morning" and "afternoon" slot.
const MORNING_CUTOFF_MINUTES = 13 * 60;

export function slotLabel(slots: string[]) {
  return slots.length > 0 ? slots.join(" + ") : "None";
}

function earliestStartMinutes(ids: string[], slots: TimeSlot[]): number | null {
  if (ids.length === 0) {
    return null;
  }
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const startTimes = ids
    .map((id) => slotMap.get(id)?.startTime)
    .filter((value): value is string => Boolean(value))
    .map((value) => parseTime(value));
  return startTimes.length > 0 ? Math.min(...startTimes) : null;
}

/**
 * Classifies by theory time when a theory component exists; falls back to lab
 * time for lab-only options (e.g. a standalone lab course) so those aren't
 * dumped into "unscheduled" — confirmed against the real catalog that this
 * reproduces the same morning (L1-L30, before 13:00) / afternoon (L31-L60,
 * from 14:00) split directly, without hardcoding lab-number ranges.
 */
export function classifyTimeOfDay(rawTheorySlots: string[], rawLabSlots: string[], slots: TimeSlot[]): TimeOfDay {
  const theoryIds = rawTheorySlots.length > 0 ? resolveTheorySlotIds(rawTheorySlots.join(","), slots) : [];
  const theoryStart = earliestStartMinutes(theoryIds, slots);
  if (theoryStart !== null) {
    return theoryStart < MORNING_CUTOFF_MINUTES ? "morning" : "afternoon";
  }

  const labIds = rawLabSlots.length > 0 ? resolveLabSlotIds(rawLabSlots.join(","), slots) : [];
  const labStart = earliestStartMinutes(labIds, slots);
  if (labStart !== null) {
    return labStart < MORNING_CUTOFF_MINUTES ? "morning" : "afternoon";
  }

  return "unscheduled";
}

export type OptionGroup = {
  slotKey: string;
  theoryLabel: string;
  timeOfDay: TimeOfDay;
  options: DBCourseOption[];
};

export function groupOptionsBySlot(options: DBCourseOption[], slots: TimeSlot[]): OptionGroup[] {
  const groups = new Map<string, OptionGroup>();

  for (const option of options) {
    const sortedTheory = [...option.theory_slots].sort();
    // Lab-only options (no theory component) group by their real lab pair
    // instead of collapsing every professor into one "None" bucket.
    const sortedLab = [...option.lab_slots].sort();
    const groupSlots = sortedTheory.length > 0 ? sortedTheory : sortedLab;
    const slotKey = groupSlots.join("+");
    const existing = groups.get(slotKey);
    if (existing) {
      existing.options.push(option);
      continue;
    }
    groups.set(slotKey, {
      slotKey,
      theoryLabel: slotLabel(groupSlots),
      timeOfDay: classifyTimeOfDay(option.theory_slots, option.lab_slots, slots),
      options: [option]
    });
  }

  return Array.from(groups.values());
}

export function FPTimeOfDayToggle({
  value,
  onChange
}: {
  value: TimeOfDayFilter;
  onChange: (value: TimeOfDayFilter) => void;
}) {
  const options: { id: TimeOfDayFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "morning", label: "Morning" },
    { id: "afternoon", label: "Afternoon" }
  ];

  return (
    <div className="flex gap-1.5">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "fp-label rounded-[var(--radius-sm)] border px-2.5 py-1 text-[length:var(--text-micro)] transition-colors",
              active ? "border-fp-border-accent text-fp-accent" : "border-fp-border-default text-fp-text-dim hover:text-fp-text-body"
            )}
            style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FPSlotOptionChip({
  theoryLabel,
  count,
  hasTicked,
  expanded,
  onToggle,
  children
}: {
  theoryLabel: string;
  count: number;
  hasTicked: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-md)] border",
        hasTicked ? "border-fp-border-accent" : "border-fp-border-default"
      )}
      style={hasTicked && !expanded ? { backgroundColor: "var(--accent-wash)" } : undefined}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
        <span className="font-fp-mono text-[length:var(--text-small)] text-fp-text-strong">{theoryLabel}</span>
        <FPLabel tone={hasTicked ? "accent" : "dim"}>
          {count} prof{count === 1 ? "" : "s"}
        </FPLabel>
        <ChevronDown className={cn("ml-auto h-3.5 w-3.5 shrink-0 text-fp-text-dim transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? <div className="space-y-2 border-t border-fp-border-default p-2.5">{children}</div> : null}
    </div>
  );
}
