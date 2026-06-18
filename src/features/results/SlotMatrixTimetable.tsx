"use client";

import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Course, ScoredTimetable, TimeSlot } from "@/engine/types";
import { cn } from "@/utils/cn";
import {
  buildMatrixCells,
  buildMatrixColumns,
  MatrixCell
} from "./timetableMatrix";

export function SlotMatrixTimetable({
  schedule,
  slots,
  courses,
  onCellClick,
  highlightCourseCode,
  activeCellId
}: {
  schedule: ScoredTimetable | null;
  slots: TimeSlot[];
  courses: Course[];
  onCellClick?: (cell: MatrixCell, anchor: DOMRect) => void;
  highlightCourseCode?: string | null;
  activeCellId?: string | null;
}) {
  const matrix = useMemo(() => {
    if (!schedule) return null;
    return buildMatrixCells(schedule, slots, courses);
  }, [schedule, slots, courses]);

  const columns = useMemo(() => buildMatrixColumns(slots), [slots]);

  const days = useMemo(
    () => [...new Set(slots.map((slot) => slot.day))],
    [slots]
  );

  const isBhopal = useMemo(
    () => slots.some((slot) => /^[A-F]\d{2}$/.test(slot.label)),
    [slots]
  );

  const totalCredits =
    schedule?.selections.reduce(
      (sum, selection) => sum + selection.credits,
      0
    ) ?? 0;

  if (!schedule || !matrix) {
    return (
      <Card className="border-border/70 bg-card/80">
        <CardContent className="flex min-h-[300px] items-center justify-center p-8 text-center">
          <div>
            <p className="text-lg font-semibold">No schedule selected</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Generate schedules in the planner or reopen one from saved timetables.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderCellContent = (cell: MatrixCell) => {
    if (cell.slotLabel === "Lunch") {
      return null;
    }
    if (!cell.occupied && !cell.slotLabel) {
      return null;
    }
    if (cell.occupied) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-[2px]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
            {cell.slotLabel}
          </span>
          <span className="text-[11px] font-bold leading-tight tracking-tight text-white">
            {cell.courseCode}
          </span>
          <span className="line-clamp-1 text-[9px] font-medium leading-tight text-white/85">
            {cell.professorName}
          </span>
        </div>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-muted-foreground/40">
        {cell.slotLabel || "-"}
      </span>
    );
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/95 shadow-card">
      <div className="border-b border-border/60 bg-secondary/10 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/25 bg-primary/10 text-primary">
                Score {schedule.score}
              </Badge>
              <Badge className="border-border/60 bg-background/50">
                {schedule.rankingMode}
              </Badge>
              <Badge className="border-border/60 bg-background/50">
                {totalCredits} credits
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Compact matrix with unified theory and lab grouping.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1 font-medium">
              {schedule.metrics.freeDays} free days
            </span>
            <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1 font-medium">
              {schedule.metrics.totalGapSlots} gap slots
            </span>
            <span className="rounded-full border border-border/60 bg-background/50 px-3 py-1 font-medium">
              Ends {schedule.metrics.latestEndTime}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/40 shadow-inner">
          <table className="w-full min-w-[1080px] table-fixed border-collapse text-center">
            <colgroup>
              <col className="w-12" />
              <col className="w-14" />
              {columns.theory.map((col, i) => (
                <col
                  key={i}
                  className={col.kind === "lunch" ? "w-10" : "w-[72px]"}
                />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border border-border/60 bg-secondary/30 px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  THEORY
                </th>
                <th className="border border-border/60 bg-secondary/20 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Start
                </th>
                {columns.theory.map((col, i) => (
                  <th
                    key={`t-s-${i}`}
                    className={cn(
                      "border border-border/60 bg-secondary/10 px-1 py-1 text-[10px] font-medium text-muted-foreground",
                      col.kind === "lunch" && "bg-secondary/20"
                    )}
                  >
                    {col.kind === "lunch" ? "Lunch" : col.startTime}
                  </th>
                ))}
              </tr>

              <tr>
                <th className="border border-border/60 bg-secondary/20 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  End
                </th>
                {columns.theory.map((col, i) => (
                  <th
                    key={`t-e-${i}`}
                    className={cn(
                      "border border-border/60 bg-secondary/10 px-1 py-1 text-[10px] font-medium text-muted-foreground",
                      col.kind === "lunch" && "bg-secondary/20"
                    )}
                  >
                    {col.kind === "lunch" ? "Lunch" : col.endTime}
                  </th>
                ))}
              </tr>

              {!isBhopal && (
                <>
                  <tr>
                    <th
                      rowSpan={2}
                      className="border border-border/60 bg-secondary/30 px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      LAB
                    </th>
                    <th className="border border-border/60 bg-secondary/20 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Start
                    </th>
                    {columns.lab.map((col, i) => (
                      <th
                        key={`l-s-${i}`}
                        className={cn(
                          "border border-border/60 bg-secondary/10 px-1 py-1 text-[10px] font-medium text-muted-foreground",
                          col.kind === "lunch" && "bg-secondary/20"
                        )}
                      >
                       {col.kind === "lunch" ? "Lunch" : col.startTime}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th className="border border-border/60 bg-secondary/20 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      End
                    </th>
                    {columns.lab.map((col, i) => (
                      <th
                        key={`l-e-${i}`}
                        className={cn(
                          "border border-border/60 bg-secondary/10 px-1 py-1 text-[10px] font-medium text-muted-foreground",
                          col.kind === "lunch" && "bg-secondary/20"
                        )}
                      >
                        {col.kind === "lunch" ? "Lunch" : col.endTime}
                      </th>
                    ))}
                  </tr>
                </>
              )}
            </thead>

            <tbody>
              {days.map((day, dayIndex) => {
                if (isBhopal) {
                  return (
                    <tr key={day}>
                      <td className="border border-border/60 bg-secondary/20 px-1 py-2 align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {day.slice(0, 3)}
                      </td>
                      <td className="border border-border/60 bg-secondary/10 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        TH
                      </td>
                      {(matrix.theory[dayIndex] ?? []).map((cell, i) => {
                        const isLunch = cell.slotLabel === "Lunch";
                        const isActive = activeCellId === cell.id;
                        const isMatched = Boolean(
                          highlightCourseCode && cell.courseCode === highlightCourseCode
                        );

                        return (
                          <td
                            key={`t-${i}`}
                            className={cn(
                              "border border-border/50 p-0 align-top",
                              isLunch && "bg-secondary/20"
                            )}
                          >
                            <motion.button
                              layout={cell.occupied ? "position" : false}
                              type="button"
                              disabled={isLunch}
                              onClick={(e) =>
                                onCellClick?.(cell, e.currentTarget.getBoundingClientRect())
                              }
                              className={cn(
                                "min-h-[52px] w-full px-1 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                                isLunch
                                  ? "cursor-default"
                                  : cell.occupied
                                    ? "relative border-0 shadow-sm hover:z-10"
                                    : "bg-background/20 text-muted-foreground hover:bg-secondary/40",
                                isActive && "ring-2 ring-primary ring-inset",
                                isMatched && "ring-1 ring-primary/50 ring-inset opacity-100",
                                !isMatched &&
                                  highlightCourseCode &&
                                  cell.occupied &&
                                  "opacity-40"
                              )}
                              whileHover={
                                cell.occupied && !isLunch
                                  ? { scale: 1.01, y: -2, transition: { duration: 0.15 } }
                                  : undefined
                              }
                              whileTap={
                                cell.occupied && !isLunch ? { scale: 0.96 } : undefined
                              }
                              style={
                                !isLunch && cell.occupied
                                  ? {
                                      background: `linear-gradient(135deg, ${cell.color}, ${cell.color}dd)`
                                    }
                                  : undefined
                              }
                            >
                              {renderCellContent(cell)}
                            </motion.button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                return (
                  <Fragment key={day}>
                    <tr>
                      <td
                        rowSpan={2}
                        className="border border-border/60 bg-secondary/20 px-1 py-2 align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                      >
                        {day.slice(0, 3)}
                      </td>
                      <td className="border border-border/60 bg-secondary/10 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        TH
                      </td>
                      {(matrix.theory[dayIndex] ?? []).map((cell, i) => {
                        const isLunch = cell.slotLabel === "Lunch";
                        const isActive = activeCellId === cell.id;
                        const isMatched = Boolean(
                          highlightCourseCode && cell.courseCode === highlightCourseCode
                        );

                        return (
                          <td
                            key={`t-${i}`}
                            className={cn(
                              "border border-border/50 p-0 align-top",
                              isLunch && "bg-secondary/20"
                            )}
                          >
                            <motion.button
                              layout={cell.occupied ? "position" : false}
                              type="button"
                              disabled={isLunch}
                              onClick={(e) =>
                                onCellClick?.(cell, e.currentTarget.getBoundingClientRect())
                              }
                              className={cn(
                                "min-h-[52px] w-full px-1 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                                isLunch
                                  ? "cursor-default"
                                  : cell.occupied
                                    ? "relative border-0 shadow-sm hover:z-10"
                                    : "bg-background/20 text-muted-foreground hover:bg-secondary/40",
                                isActive && "ring-2 ring-primary ring-inset",
                                isMatched && "ring-1 ring-primary/50 ring-inset opacity-100",
                                !isMatched &&
                                  highlightCourseCode &&
                                  cell.occupied &&
                                  "opacity-40"
                              )}
                              whileHover={
                                cell.occupied && !isLunch
                                  ? { scale: 1.01, y: -2, transition: { duration: 0.15 } }
                                  : undefined
                              }
                              whileTap={
                                cell.occupied && !isLunch ? { scale: 0.96 } : undefined
                              }
                              style={
                                !isLunch && cell.occupied
                                  ? {
                                      background: `linear-gradient(135deg, ${cell.color}, ${cell.color}dd)`
                                    }
                                  : undefined
                              }
                            >
                              {renderCellContent(cell)}
                            </motion.button>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="border border-border/60 bg-secondary/10 px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        LAB
                      </td>
                      {(matrix.lab[dayIndex] ?? []).map((cell, i) => {
                        const isLunch = cell.slotLabel === "Lunch";
                        const isActive = activeCellId === cell.id;
                        const isMatched = Boolean(
                          highlightCourseCode && cell.courseCode === highlightCourseCode
                        );

                        return (
                          <td
                            key={`l-${i}`}
                            className={cn(
                              "border border-border/50 p-0 align-top",
                              isLunch && "bg-secondary/20"
                            )}
                          >
                            <motion.button
                              layout={cell.occupied ? "position" : false}
                              type="button"
                              disabled={isLunch}
                              onClick={(e) =>
                                onCellClick?.(cell, e.currentTarget.getBoundingClientRect())
                              }
                              className={cn(
                                "min-h-[52px] w-full px-1 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                                isLunch
                                  ? "cursor-default"
                                  : cell.occupied
                                    ? "relative border-0 shadow-sm hover:z-10"
                                    : "bg-background/20 text-muted-foreground hover:bg-secondary/40",
                                isActive && "ring-2 ring-primary ring-inset",
                                isMatched && "ring-1 ring-primary/50 ring-inset opacity-100",
                                !isMatched &&
                                  highlightCourseCode &&
                                  cell.occupied &&
                                  "opacity-40"
                              )}
                              whileHover={
                                cell.occupied && !isLunch
                                  ? { scale: 1.01, y: -2, transition: { duration: 0.15 } }
                                  : undefined
                              }
                              whileTap={
                                cell.occupied && !isLunch ? { scale: 0.96 } : undefined
                              }
                              style={
                                !isLunch && cell.occupied
                                  ? {
                                      background: `linear-gradient(135deg, ${cell.color}, ${cell.color}dd)`
                                    }
                                  : undefined
                              }
                            >
                              {renderCellContent(cell)}
                            </motion.button>
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}