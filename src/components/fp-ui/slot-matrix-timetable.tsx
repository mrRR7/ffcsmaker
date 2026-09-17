"use client";

import { Fragment, useMemo } from "react";
import { Course, ScoredTimetable, TimeSlot } from "@/engine/types";
import { cn } from "@/utils/cn";
import {
  buildMatrixCells,
  buildMatrixColumns,
  MatrixCell
} from "@/features/results/timetableMatrix";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPCard } from "@/components/fp-ui/card";

/**
 * FPSlotMatrixTimetable — the FFCS Planner skin's version of the classic
 * `SlotMatrixTimetable` (src/features/results/SlotMatrixTimetable.tsx).
 *
 * This is a REQUIRED, non-negotiable structural port, not a redesign: every
 * generated timetable in the app — classic or /new — uses one real layout
 * (day rows, each split into a THEORY sub-row and a LAB sub-row; period
 * columns with rowspan'd Start/End header rows; a Bhopal-specific single-row
 * variant). The mockup's "5 day columns x time rows" grid does not match how
 * VIT's actual FFCS slot system works and must not be used for a real
 * generated schedule — only for the intentionally illustrative previews
 * that have no real course data (e.g. the landing page's sample week) and
 * the small multi-cell "shape" thumbnails, which stay as coarse indicators.
 *
 * Same props/behavior as the classic component — a drop-in replacement,
 * restyled with fp-* tokens: flat real course colors (no gradients, per the
 * design system's "flat color always" rule), hairline borders, mono
 * uppercase period/day labels, no shadows, no bounce/scale motion.
 */
export function FPSlotMatrixTimetable({
  schedule,
  slots,
  courses,
  onCellClick,
  highlightCourseCode,
  activeCellId,
  showHeader = true
}: {
  schedule: ScoredTimetable | null;
  slots: TimeSlot[];
  courses: Course[];
  onCellClick?: (cell: MatrixCell, anchor: DOMRect) => void;
  highlightCourseCode?: string | null;
  activeCellId?: string | null;
  /** Set false when the caller already renders its own score/metrics header
   * (e.g. Results' page-level title + metric run) so the same numbers don't
   * appear twice on screen. */
  showHeader?: boolean;
}) {
  const matrix = useMemo(() => {
    if (!schedule) return null;
    return buildMatrixCells(schedule, slots, courses);
  }, [schedule, slots, courses]);

  const columns = useMemo(() => buildMatrixColumns(slots), [slots]);

  const days = useMemo(() => [...new Set(slots.map((slot) => slot.day))], [slots]);

  const isBhopal = useMemo(
    () => slots.some((slot) => /^[A-F]\d{2}$/.test(slot.label)),
    [slots]
  );

  const totalCredits =
    schedule?.selections.reduce((sum, selection) => sum + selection.credits, 0) ?? 0;

  if (!schedule || !matrix) {
    return (
      <FPCard padding="lg" className="flex min-h-[300px] items-center justify-center text-center">
        <div>
          <p className="font-fp-display text-[var(--text-body-size)] font-bold text-fp-text-strong">No schedule selected</p>
          <p className="mt-2 max-w-md text-[var(--text-small)] text-fp-text-dim">
            Generate schedules in the planner or reopen one from saved timetables.
          </p>
        </div>
      </FPCard>
    );
  }

  function renderCellContent(cell: MatrixCell) {
    if (cell.slotLabel === "Lunch") return null;
    if (!cell.occupied && !cell.slotLabel) return null;
    if (cell.occupied) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-[2px] font-fp-mono">
          <span className="fp-label text-[9px] opacity-75">{cell.slotLabel}</span>
          <span className="text-[var(--text-micro)] font-bold leading-tight tracking-tight">{cell.courseCode}</span>
          <span className="line-clamp-1 text-[9px] font-medium leading-tight opacity-85">
            {cell.professorName}
          </span>
        </div>
      );
    }
    return <span className="font-fp-mono text-[10px] text-fp-text-dim/60">{cell.slotLabel || "—"}</span>;
  }

  function renderCell(cell: MatrixCell, key: string) {
    const isLunch = cell.slotLabel === "Lunch";
    const isActive = activeCellId === cell.id;
    const isMatched = Boolean(highlightCourseCode && cell.courseCode === highlightCourseCode);

    return (
      <td key={key} className={cn("border border-fp-border-default p-0 align-top", isLunch && "bg-fp-bg-inset")}>
        <button
          type="button"
          disabled={isLunch}
          onClick={(event) => onCellClick?.(cell, event.currentTarget.getBoundingClientRect())}
          className={cn(
            "min-h-[52px] w-full px-1 py-1 text-center transition-colors focus-visible:outline-none",
            isLunch ? "cursor-default" : cell.occupied ? "hover:z-10 hover:brightness-110" : "bg-fp-bg-inset text-fp-text-dim hover:bg-fp-bg-raised",
            isActive && "ring-2 ring-inset",
            isMatched && "ring-1 ring-inset opacity-100",
            !isMatched && highlightCourseCode && cell.occupied && "opacity-40"
          )}
          style={{
            ...(isActive || isMatched ? { boxShadow: `inset 0 0 0 2px var(--accent)` } : null),
            ...(!isLunch && cell.occupied ? { background: cell.color, color: readableTextColor(cell.color) } : null)
          }}
        >
          {renderCellContent(cell)}
        </button>
      </td>
    );
  }

  const headCellClass = "fp-label border border-fp-border-default bg-fp-bg-surface px-1 py-1 text-[9px] text-fp-text-dim";
  const groupHeadClass = "fp-label border border-fp-border-default bg-fp-bg-inset px-1 py-1 text-[var(--text-micro)] text-fp-text-strong";
  const dayLabelClass = "fp-label whitespace-nowrap border border-fp-border-default bg-fp-bg-inset px-1 py-2 align-middle text-[var(--text-micro)] text-fp-text-strong";
  const trackLabelClass = "fp-label border border-fp-border-default bg-fp-bg-surface px-1 py-1 text-[9px] text-fp-text-dim";

  return (
    <FPCard padding="none" className="overflow-hidden">
      {showHeader ? (
        <div className="flex flex-col gap-3 border-b border-fp-border-default px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <FPBadge tone="accent">Score {schedule.score}</FPBadge>
              <FPBadge tone="neutral">{schedule.rankingMode}</FPBadge>
              <FPBadge tone="neutral">{totalCredits} credits</FPBadge>
            </div>
          </div>
          <div className="flex gap-2 text-[var(--text-micro)] text-fp-text-dim">
            <FPBadge tone="neutral" pill>
              {schedule.metrics.freeDays} free days
            </FPBadge>
            <FPBadge tone="neutral" pill>
              {schedule.metrics.totalGapSlots} gap slots
            </FPBadge>
            <FPBadge tone="neutral" pill>
              Ends {schedule.metrics.latestEndTime}
            </FPBadge>
          </div>
        </div>
      ) : null}

      <div className="p-4">
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-page">
          <table className="w-full min-w-[1080px] table-fixed border-collapse text-center">
            <colgroup>
              <col className="w-12" />
              <col className="w-14" />
              {columns.theory.map((col, i) => (
                <col key={i} className={col.kind === "lunch" ? "w-10" : "w-[72px]"} />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th rowSpan={2} className={groupHeadClass}>
                  THEORY
                </th>
                <th className={headCellClass}>Start</th>
                {columns.theory.map((col, i) => (
                  <th key={`t-s-${i}`} className={cn(headCellClass, col.kind === "lunch" && "bg-fp-bg-inset")}>
                    {col.kind === "lunch" ? "Lunch" : col.startTime}
                  </th>
                ))}
              </tr>
              <tr>
                <th className={headCellClass}>End</th>
                {columns.theory.map((col, i) => (
                  <th key={`t-e-${i}`} className={cn(headCellClass, col.kind === "lunch" && "bg-fp-bg-inset")}>
                    {col.kind === "lunch" ? "Lunch" : col.endTime}
                  </th>
                ))}
              </tr>

              {!isBhopal ? (
                <>
                  <tr>
                    <th rowSpan={2} className={groupHeadClass}>
                      LAB
                    </th>
                    <th className={headCellClass}>Start</th>
                    {columns.lab.map((col, i) => (
                      <th key={`l-s-${i}`} className={cn(headCellClass, col.kind === "lunch" && "bg-fp-bg-inset")}>
                        {col.kind === "lunch" ? "Lunch" : col.startTime}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className={headCellClass}>End</th>
                    {columns.lab.map((col, i) => (
                      <th key={`l-e-${i}`} className={cn(headCellClass, col.kind === "lunch" && "bg-fp-bg-inset")}>
                        {col.kind === "lunch" ? "Lunch" : col.endTime}
                      </th>
                    ))}
                  </tr>
                </>
              ) : null}
            </thead>

            <tbody>
              {days.map((day, dayIndex) => {
                if (isBhopal) {
                  return (
                    <tr key={day}>
                      <td className={dayLabelClass}>{day.slice(0, 3)}</td>
                      <td className={trackLabelClass}>TH</td>
                      {(matrix.theory[dayIndex] ?? []).map((cell, i) => renderCell(cell, `t-${i}`))}
                    </tr>
                  );
                }

                return (
                  <Fragment key={day}>
                    <tr>
                      <td rowSpan={2} className={dayLabelClass}>
                        {day.slice(0, 3)}
                      </td>
                      <td className={trackLabelClass}>TH</td>
                      {(matrix.theory[dayIndex] ?? []).map((cell, i) => renderCell(cell, `t-${i}`))}
                    </tr>
                    <tr>
                      <td className={trackLabelClass}>LAB</td>
                      {(matrix.lab[dayIndex] ?? []).map((cell, i) => renderCell(cell, `l-${i}`))}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </FPCard>
  );
}

/**
 * Picks readable text color (near-black or near-white) for a given hex
 * background using relative luminance. Courses carry an arbitrary
 * student-picked color, so a fixed text color can't be assumed.
 */
export function readableTextColor(hex: string | undefined): string {
  if (!hex || hex[0] !== "#" || (hex.length !== 7 && hex.length !== 4)) {
    return "#0b0e11";
  }
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const r = Number.parseInt(full.slice(1, 3), 16);
  const g = Number.parseInt(full.slice(3, 5), 16);
  const b = Number.parseInt(full.slice(5, 7), 16);
  if ([r, g, b].some((c) => Number.isNaN(c))) return "#0b0e11";
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  return luminance > 0.55 ? "#0b0e11" : "#f2f7f4";
}
