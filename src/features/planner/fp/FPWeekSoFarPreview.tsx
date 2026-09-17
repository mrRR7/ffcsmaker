"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { Course, DayOfWeek, TimeSlot } from "@/engine/types";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";
import { parseTime } from "@/engine/conflict";
import { FPScheduleGrid, FPScheduleRowLabel } from "@/components/fp-ui/schedule-grid";
import { FPScheduleBlock } from "@/components/fp-ui/schedule-block";
import { readableTextColor } from "@/components/fp-ui/slot-matrix-timetable";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";

type PreviewBlock = {
  day: DayOfWeek;
  startHour: number;
  code: string;
  slotLabel: string;
  color: string;
};

/**
 * A naive, honest "one possible layout" preview built from each course's
 * FIRST professor option — not a generated, conflict-free schedule (that's
 * what /new/results is for, using the real generator + the real slot-matrix
 * layout). This lives beside the course list purely so adding a course gives
 * an immediate visual sense of the week, matching the wireframe's two-column
 * layout instead of forcing everything into one long scrolling column.
 */
function buildPreviewBlocks(courses: Course[], slots: TimeSlot[]): PreviewBlock[] {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const blocks: PreviewBlock[] = [];

  for (const course of courses) {
    const option = course.options[0];
    if (!option) continue;
    const ids = [...option.theorySlotIds, ...option.labSlotIds, ...option.combinedSlotIds];
    for (const id of ids) {
      const slot = slotMap.get(id);
      if (!slot) continue;
      blocks.push({
        day: slot.day,
        startHour: Math.floor(parseTime(slot.startTime) / 60),
        code: course.courseCode,
        slotLabel: slot.label,
        color: course.color ?? "var(--accent)"
      });
    }
  }

  return blocks;
}

export function FPWeekSoFarPreview({
  courses,
  slots,
  actions
}: {
  courses: Course[];
  slots: TimeSlot[];
  actions?: ReactNode;
}) {
  const days = useMemo(() => getSlotDaysForSlots(slots) as DayOfWeek[], [slots]);
  const blocks = useMemo(() => buildPreviewBlocks(courses, slots), [courses, slots]);

  const { startHour, endHour } = useMemo(() => {
    if (blocks.length === 0) return { startHour: 8, endHour: 17 };
    const starts = blocks.map((b) => b.startHour);
    return {
      startHour: Math.min(8, ...starts),
      endHour: Math.max(17, ...starts.map((h) => h + 1))
    };
  }, [blocks]);

  const hours = useMemo(
    () => Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  const hasCourses = courses.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-fp-display text-[17px] font-bold text-fp-text-strong">Your week so far</h2>
          <FPLabel>One possible layout &middot; nothing locked</FPLabel>
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
            {hours.map((hour) => (
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
            <p className="rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-surface px-4 py-2.5 text-center text-[var(--text-small)] text-fp-text-dim">
              Add a course to see a live preview here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3.5">
            <FPScheduleGrid columnHeaders={days.map((d) => d.slice(0, 3))} rowLabelWidth={46}>
              {hours.map((hour) => (
                <Fragment key={hour}>
                  <FPScheduleRowLabel>{String(hour).padStart(2, "0")}:00</FPScheduleRowLabel>
                  {days.map((day) => {
                    const block = blocks.find((b) => b.day === day && b.startHour === hour);
                    return block ? (
                      <FPScheduleBlock
                        key={`${day}-${hour}`}
                        color={block.color}
                        textColor={readableTextColor(block.color)}
                        label={block.code}
                        sublabel={block.slotLabel}
                        minHeight={30}
                      />
                    ) : (
                      <FPScheduleBlock key={`${day}-${hour}`} minHeight={30} />
                    );
                  })}
                </Fragment>
              ))}
            </FPScheduleGrid>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
            {courses.map((course) => (
              <span key={course.id} className="fp-label flex items-center gap-1.5 text-[var(--text-micro)] text-fp-text-dim">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: course.color ?? "var(--accent)" }} />
                {course.courseCode}
              </span>
            ))}
          </div>

          <FPNote className="mt-4">
            Brightness is per course, not per hour &mdash; the code on the block is the thing to read. This is a
            preview of your first-choice professors, not a generated schedule.
          </FPNote>
        </>
      )}
    </div>
  );
}
