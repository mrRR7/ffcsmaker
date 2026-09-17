# Planner FFCS-Native Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Planner's generic hourly-block live preview with a real FFCS day/THEORY/LAB slot-matrix grid, and re-weight the Courses panel so that grid — not the course-adding controls — dominates the page.

**Architecture:** A new component (`FPLiveSlotMatrix`, replacing `FPWeekSoFarPreview`) reuses the pure, already-shared grid-shape helpers (`buildMatrixColumns`, `getSlotDaysForSlots`) to get the real FFCS period/day layout, then populates cells with its own local, from-scratch logic driven by each added course's first professor option — including detecting when two courses' naive picks collide on one slot. It does not import, modify, or extend `FPSlotMatrixTimetable` or `src/features/results/timetableMatrix.ts`'s `buildMatrixCells`, since those are shared with the classic app's generated-schedule rendering and structurally assume no two selections ever share a slot. Separately, `FPCoursesPane.tsx`'s existing two-column resizable layout gets re-weighted (new default/min/max widths) and the "Your courses" list moves from the wide column into the narrow rail, so the wide column is the grid alone.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS with `fp-*` design tokens (`src/app/new/fp-tokens.css`), no test framework in this repo.

**Spec:** `docs/superpowers/specs/2026-09-17-planner-ffcs-preview-design.md`

## Global Constraints

- **No test framework exists** in this repo (no jest/vitest/testing-library — confirmed by grep during the prior visual-system plan, still true). Every task's verification uses `npx tsc --noEmit`, targeted `grep`, and a live check via the Claude Browser pane (`mcp__Claude_Browser__*` tools) against the dev server at `http://localhost:3000`.
- **Do not touch:** `src/components/fp-ui/slot-matrix-timetable.tsx`, `src/features/results/timetableMatrix.ts`, anything under `src/app/new/results/`, `src/app/new/compare/`, or anything in the classic (non-`/new`) app. These are shared with generated-schedule rendering elsewhere and are explicitly out of scope (see spec's Non-Goals).
- **No conflict resolution, auto-avoidance, or click interaction for clashing slots** — the clash treatment is purely passive/visual (a `title` tooltip is fine; no click handler, no state change on click).
- **No changes to the generation/results flow** — "Find my weeks" keeps routing to `/new/results` exactly as today.
- **No changes to the zero-course empty state** — the existing skeleton-grid-behind-message treatment (using `FPScheduleGrid`/`FPScheduleRowLabel`/`FPScheduleBlock` from `src/components/fp-ui/schedule-grid.tsx`) stays byte-for-byte as it is today. Only the *populated* (`hasCourses && days.length > 0`) branch's rendering changes.
- **No copy pass** beyond the one explicitly spec'd status-indicator change (the "Draft preview · not generated" badge, replacing the old "One possible layout · nothing locked" label — this is an approved, in-scope part of the design, not a general copy cleanup). The "Your week so far" heading text does not change.
- Course/slot codes that must render in `.fp-code` (monospace, per the visual-system spec still in force): course codes (`CSE101`), slot labels (`A1`, `TB1`). Professor names and other prose stay in `.fp-text`.
- Every task commits its own change — do not batch tasks into one commit.

---

## Task 1: `FPLiveSlotMatrix` — the FFCS-native live preview grid

**Files:**
- Delete: `src/features/planner/fp/FPWeekSoFarPreview.tsx`
- Create: `src/features/planner/fp/FPLiveSlotMatrix.tsx`
- Modify: `src/features/planner/fp/FPCoursesPane.tsx` (import + JSX tag rename only — panel layout/sizing changes are Task 2)

**Interfaces:**
- Consumes: `buildMatrixColumns(slots: TimeSlot[])` and the `MatrixColumn` type from `@/features/results/timetableMatrix` (pure functions of `slots` alone — no schedule/selection data, safe to import per the spec's Design §2). `getSlotDaysForSlots(slots: TimeSlot[])` from `@/engine/slotCatalog`. `parseTime(time: string): number` from `@/engine/conflict`. `readableTextColor(hex: string | undefined): string` from `@/components/fp-ui/slot-matrix-timetable` (a pure color-math helper with no schedule dependency — this is the one existing export from that file this task uses; it does not touch the file). `FPBadge` from `@/components/fp-ui/badge`. `Course`, `CourseOption`, `TimeSlot`, `DayOfWeek` types from `@/engine/types`.
- Produces: `FPLiveSlotMatrix({ courses, slots, actions }: { courses: Course[]; slots: TimeSlot[]; actions?: ReactNode })` — same prop shape `FPWeekSoFarPreview` had, so Task 2's panel restructuring is a drop-in swap.

- [ ] **Step 1: Create `FPLiveSlotMatrix.tsx` with the full new component**

Read the current `src/features/planner/fp/FPWeekSoFarPreview.tsx` first — you need its exact empty-state branch (the `!hasCourses || days.length === 0` block) verbatim, since that branch does not change at all in this task.

Create `src/features/planner/fp/FPLiveSlotMatrix.tsx`:

```tsx
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
          style={{ background: `linear-gradient(135deg, ${colorA} 50%, ${colorB} 50%)` }}
          title={`Clashing: ${codes}`}
        >
          <span className="absolute right-[2px] top-[1px] text-[9px]" style={{ textShadow: "0 0 2px rgba(0,0,0,0.6)" }}>
            ⚠
          </span>
          <span
            className="fp-code text-[9px] font-bold leading-tight text-fp-text-strong"
            style={{ textShadow: "0 0 3px rgba(0,0,0,0.5)" }}
          >
            {slotPicks.length} courses
          </span>
        </div>
      </td>
    );
  }

  const headCellClass = "fp-code border border-fp-border-default bg-fp-bg-surface px-1 py-1 text-[9px] text-fp-text-dim";
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
            <table className="w-full table-fixed border-collapse text-center">
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
                  <th className={headCellClass}>Start</th>
                  {columns.theory.map((col, i) => (
                    <th key={`t-s-${i}`} className={headCellClass}>
                      {col.kind === "lunch" ? "Lunch" : col.startTime}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className={headCellClass}>End</th>
                  {columns.theory.map((col, i) => (
                    <th key={`t-e-${i}`} className={headCellClass}>
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
                        <th key={`l-s-${i}`} className={headCellClass}>
                          {col.kind === "lunch" ? "Lunch" : col.startTime}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className={headCellClass}>End</th>
                      {columns.lab.map((col, i) => (
                        <th key={`l-e-${i}`} className={headCellClass}>
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
            first-choice professors, not a generated schedule; a striped cell means two of your picks land on the
            same slot.
          </FPNote>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Delete the old file**

```bash
rm src/features/planner/fp/FPWeekSoFarPreview.tsx
```

- [ ] **Step 3: Update the one call site**

In `src/features/planner/fp/FPCoursesPane.tsx`, change the import:

```tsx
import { FPWeekSoFarPreview } from "@/features/planner/fp/FPWeekSoFarPreview";
```

to:

```tsx
import { FPLiveSlotMatrix } from "@/features/planner/fp/FPLiveSlotMatrix";
```

And change the JSX usage:

```tsx
<FPWeekSoFarPreview courses={courses} slots={slots} actions={actions} />
```

to:

```tsx
<FPLiveSlotMatrix courses={courses} slots={slots} actions={actions} />
```

Do not change anything else in this file yet — the rail sizing and course-list placement are Task 2.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `grep -rn "FPWeekSoFarPreview" src` — expected: no output (confirms the rename is complete everywhere).

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner` (Courses tab, a campus selected).
- With zero courses added: confirm the empty state is pixel-identical to before (skeleton grid + "Add a course to see a live preview here" — this branch did not change).
- Add two courses whose first professor options do NOT share a slot: confirm the grid now shows the real FFCS day/THEORY/LAB shape (Start/End header rows, TH/LAB row labels per day) instead of hourly blocks, and each course renders as a flat-colored cell with its course code (mono) and professor name.
- Add a third course whose first professor option DOES share a slot with one already added: confirm that cell renders the diagonal split-color clash treatment with the warning glyph, and hovering it shows a tooltip listing both course codes. Confirm clicking it does nothing (no interaction).
- Confirm the "Draft preview · not generated" badge renders in amber/warn tone, in the position the old "One possible layout · nothing locked" label used to occupy.
- Check console for errors (`onlyErrors: true`).

- [ ] **Step 5: Commit**

```bash
git add src/features/planner/fp/FPLiveSlotMatrix.tsx src/features/planner/fp/FPCoursesPane.tsx
git commit -m "Replace generic hourly planner preview with real FFCS slot-matrix grid

FPLiveSlotMatrix renders the actual day/THEORY/LAB structure (reusing
the pure buildMatrixColumns/getSlotDaysForSlots shape helpers) driven
by each added course's first professor option, with a passive visual
clash indicator when two picks collide on one slot. Does not touch
FPSlotMatrixTimetable or timetableMatrix.ts's buildMatrixCells, which
remain the real generated-schedule renderer.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Re-weight the Courses panel — grid-dominant split

**Files:**
- Modify: `src/features/planner/fp/FPCoursesPane.tsx`

**Interfaces:**
- Consumes: `FPLiveSlotMatrix` from Task 1 (unchanged props).
- Produces: no new exports — internal layout/sizing change only.

- [ ] **Step 1: Re-weight the rail sizing constants**

In `src/features/planner/fp/FPCoursesPane.tsx`, find:

```tsx
const DEFAULT_RAIL_WIDTH = 520;
const MIN_RAIL_WIDTH = 380;
const MAX_RAIL_WIDTH = 760;
```

Change to:

```tsx
const DEFAULT_RAIL_WIDTH = 400;
const MIN_RAIL_WIDTH = 340;
const MAX_RAIL_WIDTH = 480;
```

(Existing `localStorage`-persisted widths from before this change are automatically re-clamped into the new range by the existing `clampRailWidth` call on read — no migration code needed.)

- [ ] **Step 2: Move the course list into the left rail**

Find the left `<section>`'s tab-content block:

```tsx
        <div>
          {tab === "search" ? <FPSearchTab /> : null}
          {tab === "paste" ? <FPPasteTab /> : null}
          {tab === "import" ? <FPImportTab /> : null}
          {tab === "manual" ? <FPCourseList showAddForm showList={false} /> : null}
        </div>
      </section>
```

Change to:

```tsx
        <div>
          {tab === "search" ? <FPSearchTab /> : null}
          {tab === "paste" ? <FPPasteTab /> : null}
          {tab === "import" ? <FPImportTab /> : null}
          {tab === "manual" ? <FPCourseList showAddForm showList={false} /> : null}
        </div>

        <div className="mt-6 border-t border-fp-border-default pt-6">
          <FPCourseList showAddForm={false} showList />
        </div>
      </section>
```

(This is the exact same list-rendering call, with the exact same wrapper classes, that used to live in the right `<aside>` — only its location moves. `FPCourseList` self-pads with `p-6`, so no extra horizontal padding is needed on this wrapper, matching how it worked in its previous location.)

- [ ] **Step 3: Remove the course list from the right aside**

Find:

```tsx
      <aside className="min-w-0 border-t border-fp-border-default bg-fp-bg-surface px-6 py-6 lg:border-t-0">
        <FPLiveSlotMatrix courses={courses} slots={slots} actions={actions} />
        <div className="mt-6 border-t border-fp-border-default pt-6">
          <FPCourseList showAddForm={false} showList />
        </div>
      </aside>
```

Change to:

```tsx
      <aside className="min-w-0 border-t border-fp-border-default bg-fp-bg-surface px-6 py-6 lg:border-t-0">
        <FPLiveSlotMatrix courses={courses} slots={slots} actions={actions} />
      </aside>
```

- [ ] **Step 4: Update the file's own stale docstring**

Find, near the top of the file:

```tsx
/**
 * FPCoursesPane — "01 Courses" tab of /new/planner.
 *
 * Two columns: a resizable course-adding rail on the left (search/paste/
 * import/manual tabs), and the "your week so far" live preview on the right
 * with the added-courses list underneath it — the whole right pane scrolls
 * normally with the page, nothing pinned.
 */
```

Change to:

```tsx
/**
 * FPCoursesPane — "01 Courses" tab of /new/planner.
 *
 * Two columns: a resizable rail on the left holding course-adding controls
 * (search/paste/import/manual tabs) and the added-courses list stacked
 * below them, and the live FFCS preview grid alone on the right, dominant
 * and full-height — the whole pane scrolls normally with the page, nothing
 * pinned.
 */
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner` (Courses tab, a campus selected).
- Confirm the resizable divider now defaults to roughly a 400px-wide left rail against the remaining width on a typical desktop viewport (the grid should visibly occupy the clear majority of the pane).
- Confirm the "Your courses" list now renders in the LEFT rail, below the active tab's content (Search/Paste/Import/Manual), not in the right column.
- Switch to the Manual tab: confirm you see the manual add-form followed immediately by the course list below it, in the same rail.
- Confirm the right column now contains only the `FPLiveSlotMatrix` grid, full height, no course list beneath it.
- Drag the resize handle to its new min (340px) and max (480px) and confirm it clamps correctly and persists across a page reload (`fp_planner_rail_width` in `localStorage`).
- Spot-check `FPCourseList`'s professor-option rows at the new ~340-480px rail width — confirm names/slot codes/lock-delete icons don't visibly overlap or clip. If they do, that's the implementation-time risk the spec flagged; make the minimal wrapping/truncation fix needed (e.g. allow the row to wrap onto two lines) rather than redesigning the component, and note what you changed in this task's completion report.
- Check console for errors (`onlyErrors: true`), in both dark and light theme (toggle via the header's theme button).

- [ ] **Step 6: Commit**

```bash
git add src/features/planner/fp/FPCoursesPane.tsx
git commit -m "Re-weight Courses panel so the live timetable dominates

Rail defaults from 520/380-760px to 400/340-480px, and the course list
moves from the wide column into the rail alongside Search/Paste/
Import/Manual — the wide column now shows only the FFCS live-preview
grid.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

**Spec coverage check:**
- Grid shape replacement (generic hourly → real FFCS day/THEORY/LAB) — Task 1.
- Clash detection, passive-only — Task 1.
- Status framing reusing `FPBadge tone="warn"` — Task 1.
- Panel re-weighting (rail sizing) — Task 2.
- Course list moves into the rail — Task 2.
- Generation/results flow unchanged — no task touches it (verified as a non-goal, nothing in either task's diff reaches `planner/page.tsx`'s "Find my weeks" handler).
- Empty-state preserved verbatim — Task 1 Step 1 copies it unchanged from the current file, Task 1 Step 4 explicitly verifies pixel-identical behavior.
- `FPSlotMatrixTimetable`/`timetableMatrix.ts` untouched — neither task's file list includes them; Task 1 only imports the pure `buildMatrixColumns` function and the pure `readableTextColor` helper, both already safe per the spec's Design §2 reasoning.

**Type consistency check:** `FPLiveSlotMatrix`'s prop shape (`{ courses: Course[]; slots: TimeSlot[]; actions?: ReactNode }`) is defined once in Task 1 and consumed identically in Task 1 Step 3 and Task 2 Step 3 — no renamed fields between tasks.

**No-placeholder scan:** both tasks give complete literal before/after code for every step; no "add appropriate styling"/"similar to Task N" language.
