"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { Course, CourseOption, DayOfWeek, TimeSlot } from "@/engine/types";
import { parseTime } from "@/engine/conflict";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { buildMatrixColumns, MatrixColumn } from "@/features/results/timetableMatrix";
import { readableTextColor } from "@/components/fp-ui/slot-matrix-timetable";
import { FPScheduleGrid, FPScheduleRowLabel } from "@/components/fp-ui/schedule-grid";
import { FPScheduleBlock } from "@/components/fp-ui/schedule-block";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPNote } from "@/components/fp-ui/note";

type Pick = { course: Course; option: CourseOption };

/**
 * FPLiveSlotMatrix — the Planner's live "what if I add these courses" preview.
 *
 * Renders the real FFCS day/THEORY/LAB slot-matrix shape (the same period
 * layout FPSlotMatrixTimetable uses for real generated schedules), but is
 * populated from each added course's FIRST professor option with no
 * conflict resolution at all — it is deliberately not the real generator.
 * Two courses landing on the same slot render as a clash cell rather than
 * silently overlapping. This is a from-scratch, /new-only cell-population
 * path: it does NOT import or extend `buildMatrixCells`/`FPSlotMatrixTimetable`,
 * since those assume a real generated schedule can never have two selections
 * share a slot, and are shared with the classic app's own timetable.
 */
export function FPLiveSlotMatrix({
  courses,
  slots,
  actions
}: {
  courses: Course[];
  slots: TimeSlot[];
  actions?: ReactNode;
}) {
  const days = useMemo(() => getSlotDaysForSlots(slots) as DayOfWeek[], [slots]);
  const columns = useMemo(() => buildMatrixColumns(slots), [slots]);
  const isBhopal = useMemo(() => slots.some((slot) => /^[A-F]\d{2}$/.test(slot.label)), [slots]);

  const picks = useMemo<Pick[]>(
    () =>
      courses
        .map((course) => ({ course, option: course.options[0] }))
        .filter((pick): pick is Pick => Boolean(pick.option)),
    [courses]
  );

  const picksBySlotId = useMemo(() => {
    const map = new Map<string, Pick[]>();
    for (const pick of picks) {
      const ids = [...pick.option.theorySlotIds, ...pick.option.labSlotIds, ...pick.option.combinedSlotIds];
      for (const id of ids) {
        map.set(id, [...(map.get(id) ?? []), pick]);
      }
    }
    return map;
  }, [picks]);

  const hasCourses = courses.length > 0;

  function getDaySlots(day: DayOfWeek, kind: "theory" | "lab"): TimeSlot[] {
    return slots
      .filter((slot) => slot.day === day && slot.kind === kind)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  }

  function resolveSlot(daySlots: TimeSlot[], track: "THEORY" | "LAB", column: MatrixColumn): TimeSlot | null {
    if (column.kind === "lunch") return null;
    if (track === "LAB") {
      return (
        daySlots.find(
          (slot) => slot.startTime === column.sourceStartTime && slot.endTime === column.sourceEndTime
        ) ?? null
      );
    }
    return daySlots.find((slot) => slot.startTime === column.startTime && slot.endTime === column.endTime) ?? null;
  }

  function renderCell(daySlots: TimeSlot[], track: "THEORY" | "LAB", column: MatrixColumn, key: string) {
    if (column.kind === "lunch") {
      return <td key={key} className="border border-fp-border-default bg-fp-bg-inset" />;
    }

    const slot = resolveSlot(daySlots, track, column);
    const slotPicks = slot ? (picksBySlotId.get(slot.id) ?? []) : [];

    if (slotPicks.length === 0) {
      return (
        <td key={key} className="border border-fp-border-default p-0 align-middle">
          <div className="fp-code flex h-[52px] items-center justify-center text-[10px] text-fp-text-dim/60">—</div>
        </td>
      );
    }

    if (slotPicks.length === 1) {
      const { course, option } = slotPicks[0];
      const color = course.color ?? "var(--accent)";
      return (
        <td key={key} className="border border-fp-border-default p-0 align-top">
          <div
            className="flex h-[52px] flex-col items-center justify-center gap-[2px]"
            style={{ background: color, color: readableTextColor(color) }}
          >
            <span className="fp-code text-[length:var(--text-micro)] font-bold leading-tight">{course.courseCode}</span>
            <span className="fp-text line-clamp-1 text-[9px] font-medium leading-tight opacity-85">
              {option.professorName}
            </span>
          </div>
        </td>
      );
    }

    const codes = slotPicks.map((pick) => pick.course.courseCode).join(", ");
    const colorA = slotPicks[0].course.color ?? "var(--accent)";
    const colorB = slotPicks[1].course.color ?? "var(--danger)";
    return (
      <td key={key} className="border border-fp-border-default p-0 align-top">
        <div
          className="relative flex h-[52px] flex-col items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colorA} 50%, ${colorB} 50%)`, color: readableTextColor(colorA) }}
          title={`Clashing: ${codes}`}
        >
          <span className="absolute right-[2px] top-[1px] text-[9px]" style={{ textShadow: "0 0 2px rgba(0,0,0,0.6)" }}>
            ⚠
          </span>
          <span
            className="fp-text text-[9px] font-bold leading-tight"
            style={{ textShadow: "0 0 3px rgba(0,0,0,0.5)" }}
          >
            {slotPicks.length} courses
          </span>
        </div>
      </td>
    );
  }

  const headCellClass = "border border-fp-border-default bg-fp-bg-surface px-1 py-1 text-[9px] text-fp-text-dim";
  const groupHeadClass =
    "fp-code border border-fp-border-default bg-fp-bg-inset px-1 py-1 text-[length:var(--text-micro)] text-fp-text-strong";
  const dayLabelClass =
    "fp-code whitespace-nowrap border border-fp-border-default bg-fp-bg-inset px-1 py-2 align-middle text-[length:var(--text-micro)] text-fp-text-strong";
  const trackLabelClass = "fp-code border border-fp-border-default bg-fp-bg-surface px-1 py-1 text-[9px] text-fp-text-dim";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-fp-display text-[17px] font-bold text-fp-text-strong">Your week so far</h2>
          <FPBadge tone="warn">Draft preview · not generated</FPBadge>
        </div>
        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>

      {!hasCourses || days.length === 0 ? (
        <div className="relative mt-3.5">
          <FPScheduleGrid
            columnHeaders={(days.length > 0 ? days : (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as DayOfWeek[])).map(
              (d) => d.slice(0, 3)
            )}
            rowLabelWidth={46}
          >
            {Array.from({ length: 9 }, (_, i) => 8 + i).map((hour) => (
              <Fragment key={hour}>
                <FPScheduleRowLabel>{String(hour).padStart(2, "0")}:00</FPScheduleRowLabel>
                {(days.length > 0 ? days : (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as DayOfWeek[])).map(
                  (day) => (
                    <FPScheduleBlock key={`${day}-${hour}`} minHeight={30} />
                  )
                )}
              </Fragment>
            ))}
          </FPScheduleGrid>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-[var(--radius-md)] bg-fp-bg-surface px-4 py-2.5 text-center text-[length:var(--text-small)] text-fp-text-dim">
              Add a course to see a live preview here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3.5 overflow-x-auto rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-page">
            <table className="w-full min-w-[860px] table-fixed border-collapse text-center">
              <colgroup>
                <col style={{ width: "30px" }} />
                <col style={{ width: "34px" }} />
                {columns.theory.map((col, i) => (
                  <col key={i} style={{ width: col.kind === "lunch" ? "28px" : undefined }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className={groupHeadClass}>
                    TH
                  </th>
                  <th className={`fp-text ${headCellClass}`}>Start</th>
                  {columns.theory.map((col, i) => (
                    <th key={`t-s-${i}`} className={col.kind === "lunch" ? `fp-text ${headCellClass}` : `fp-code ${headCellClass}`}>
                      {col.kind === "lunch" ? "Lunch" : col.startTime}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className={`fp-text ${headCellClass}`}>End</th>
                  {columns.theory.map((col, i) => (
                    <th key={`t-e-${i}`} className={col.kind === "lunch" ? `fp-text ${headCellClass}` : `fp-code ${headCellClass}`}>
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
                      <th className={`fp-text ${headCellClass}`}>Start</th>
                      {columns.lab.map((col, i) => (
                        <th key={`l-s-${i}`} className={col.kind === "lunch" ? `fp-text ${headCellClass}` : `fp-code ${headCellClass}`}>
                          {col.kind === "lunch" ? "Lunch" : col.startTime}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className={`fp-text ${headCellClass}`}>End</th>
                      {columns.lab.map((col, i) => (
                        <th key={`l-e-${i}`} className={col.kind === "lunch" ? `fp-text ${headCellClass}` : `fp-code ${headCellClass}`}>
                          {col.kind === "lunch" ? "Lunch" : col.endTime}
                        </th>
                      ))}
                    </tr>
                  </>
                ) : null}
              </thead>
              <tbody>
                {days.map((day) => {
                  const theoryDaySlots = getDaySlots(day, "theory");
                  const labDaySlots = getDaySlots(day, "lab");

                  if (isBhopal) {
                    return (
                      <tr key={day}>
                        <td className={dayLabelClass}>{day.slice(0, 3)}</td>
                        <td className={trackLabelClass}>TH</td>
                        {columns.theory.map((col, i) => renderCell(theoryDaySlots, "THEORY", col, `t-${i}`))}
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
                        {columns.theory.map((col, i) => renderCell(theoryDaySlots, "THEORY", col, `t-${i}`))}
                      </tr>
                      <tr>
                        <td className={trackLabelClass}>LAB</td>
                        {columns.lab.map((col, i) => renderCell(labDaySlots, "LAB", col, `l-${i}`))}
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
            {courses.map((course) => (
              <span
                key={course.id}
                className="fp-text flex items-center gap-1.5 text-[length:var(--text-micro)] text-fp-text-dim"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: course.color ?? "var(--accent)" }} />
                {course.courseCode}
              </span>
            ))}
          </div>

          <FPNote className="mt-4">
            Brightness has no meaning here &mdash; each course keeps its own color. This is a preview of your
            first-choice professors, not a generated schedule; a split-colored cell means two or more of your picks
            land on the same slot.
          </FPNote>
        </>
      )}
    </div>
  );
}
