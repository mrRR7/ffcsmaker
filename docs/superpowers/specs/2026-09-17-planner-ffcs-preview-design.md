# Planner IA: FFCS-Native Live Preview & Panel Re-Weighting

## Context

This is the first sub-project of the "structural/content" track that was explicitly split off from the `/new` FFCS Planner skin's visual-system pass (see `docs/superpowers/specs/2026-09-17-fp-visual-system-design.md`). That pass fixed typography, color, borders, and icons; it deliberately left untouched the deeper structural complaints from the original design critique: a generic (non-FFCS) calendar grid standing in for the timetable, the timetable being visually subordinate to page chrome, an arguably-unnecessary panel split, and a dense-but-functionally-empty page before any course is added.

Of those, this spec tackles the single highest-leverage change: replacing the Planner's live "week so far" preview — currently a generic hourly-block grid — with a genuine FFCS-native day/THEORY/LAB slot-matrix presentation, and making that grid the dominant object on the page. The remaining structural items (the zero-course empty state, deeper control-hierarchy/prominence decisions, nav/IA cleanup, and a copy pass) are explicitly out of scope here and will be brainstormed as their own follow-ups, in that order.

**Why this one first:** it attacks four of the critique's points at once — the grid's shape becomes real FFCS structure instead of a generic scheduling-app grid; the timetable becomes the reason the page exists rather than a passive sidebar element; the current left-course/right-preview panel split gets re-examined now that we know what the primary visual object actually is; and a page whose dominant object is a real (if provisional) schedule reads as purposeful rather than empty, even before Preferences or Results are touched.

**A load-bearing existing constraint:** `FPSlotMatrixTimetable` (`src/components/fp-ui/slot-matrix-timetable.tsx`) is the app's one real generated-timetable renderer — its own docstring calls it a "REQUIRED, non-negotiable structural port," shared conceptually with the classic app's `SlotMatrixTimetable.tsx`. It expects a full `ScoredTimetable` (a resolved, conflict-free, generated-and-ranked schedule). The Planner's live preview is fundamentally different data — a naive "first professor option per added course" placement with **no conflict resolution at all** — so this spec does not reuse that component or its supporting `src/features/results/timetableMatrix.ts` utilities. See Design §2 for the chosen alternative.

## Goals

- Replace the Planner's generic hourly-block live preview with the real FFCS day/THEORY/LAB grid shape (the same period/day structure `FPSlotMatrixTimetable` renders, not a from-scratch grid design).
- Make that grid the dominant visual object in the Planner's Courses tab — the majority of the pane's width, full height, nothing else competing for that space.
- Re-weight (not restructure) the existing two-column resizable layout: course-building controls (Search/Paste/Import/Manual tabs *and* the added-courses list) consolidate into one narrower rail; the grid alone occupies the wider column.
- Visually and honestly represent that this preview is provisional: a persistent "draft" status indicator, and a passive (non-interactive) visual treatment for any slot where two added courses' naive picks collide.

## Non-Goals

- No changes to the zero-course empty state (a separate, later spec).
- No changes to which controls are prominent vs. secondary beyond the panel move described here (a separate, later spec covering control hierarchy).
- No changes to top-level navigation/IA.
- No copy pass.
- No changes to `FPSlotMatrixTimetable`, `src/features/results/timetableMatrix.ts`, or anything in the classic (non-`/new`) app.
- No change to the generation/results flow: "Find my weeks" continues to route to `/new/results` exactly as today. The Planner's grid never shows a real generated result — it is always the naive draft.
- No conflict resolution, auto-avoidance, or click-to-resolve interaction for clashing slots. Purely passive visual indication.

## Design

### 1. Panel re-weighting (`src/features/planner/fp/FPCoursesPane.tsx`)

The existing two-column resizable grid (`lg:grid`, draggable divider, `railWidth` persisted to `localStorage` under `fp_planner_rail_width`) stays structurally the same mechanism — only its role and default sizing change:

- **Left rail (resizable, unchanged mechanism):** keeps its Search/Paste/Import/Manual tab bar exactly as today. Newly added: the "Your courses" list (currently `<FPCourseList showAddForm={false} showList />`, rendered today in the right column below the preview) moves into this rail, stacked below the active tab's content. The rail becomes "everything about building your course list," start to finish.
- **Right column:** drops the current `<FPWeekSoFarPreview>` + course-list stack entirely. Renders only the new live-preview grid component (§2), full height.
- **Sizing:** `DEFAULT_RAIL_WIDTH` changes from `520` to `400`. `MIN_RAIL_WIDTH` changes from `380` to `340`. `MAX_RAIL_WIDTH` changes from `760` to `480`. This re-centers the rail as the narrower (~30-35% on a typical viewport) side and gives the grid the remaining majority width by default, while keeping the drag handle fully functional for anyone who wants a different split. The `localStorage` key and persistence behavior are unchanged; existing stored widths from before this change will simply be re-clamped into the new `[340, 480]` range on next load (clamping already happens via `clampRailWidth` on every read).

**Known implementation-time risk, not a design decision:** `FPCourseList`'s `CourseCard`/`SortableOptionRow` rows (professor name, slot codes, lock/delete icon buttons) were built assuming the wider right column's space. At the new rail width (340-480px) these may need to wrap onto a second line or otherwise compress. Handle this as a normal layout fix during implementation — if it turns out to need more than minor wrapping/truncation adjustments, flag it back rather than improvising a redesign.

### 2. The live-preview grid component

**New component**, tentatively named `FPLiveSlotMatrix` (naming echoes `FPSlotMatrixTimetable` — "live" signals "not generated," parallel to that component's "real, generated" role). Replaces the internals of `src/features/planner/fp/FPWeekSoFarPreview.tsx` in place (same file, new implementation; the file's current naive-hourly-grid approach — `buildPreviewBlocks`, the `PreviewBlock` type, the `FPScheduleGrid`/`FPScheduleBlock` rendering — is deleted, not extended).

**Props** (mirrors the current `FPWeekSoFarPreview` call site in `FPCoursesPane.tsx` so the integration point doesn't need to change beyond the render location):

```tsx
{
  courses: Course[];
  slots: TimeSlot[];
  actions?: ReactNode;   // unchanged — still slots in the existing header action row, if any
}
```

**Grid shape:** built from `buildMatrixColumns(slots)` and `getSlotDaysForSlots(slots)` — both from `src/features/results/timetableMatrix.ts` and `src/engine/slotCatalog.ts` respectively. These are pure functions of `slots` alone (no schedule/selection data in, no side effects) already imported elsewhere in `/new` (e.g. `FPScheduleGrid`'s callers), so importing them here does not touch or extend `timetableMatrix.ts`. This gives the exact real period-column/day-row shape (including the Bhopal single-row variant and lunch-column insertion) with zero duplicated logic for that part.

**Cell population — new, from-scratch, local logic (not `buildMatrixCells`):**

1. Build the naive pick list: `courses.map(c => ({ course: c, option: c.options[0] })).filter(p => p.option)` — first professor option per added course, same "honest, not pretending to be generated" principle the current preview already documents.
2. Build a `Map<string, {course, option}[]>` keyed by slot ID: for each pick, push it under every ID in `option.theorySlotIds`, `option.labSlotIds`, and `option.combinedSlotIds`.
3. For each grid cell (day × column, from step 1's shape), resolve which real `TimeSlot` occupies it using the same day/kind/start-end-time matching `buildMatrixCells` uses (lab columns match by `sourceStartTime`/`sourceEndTime` since a lab slot spans two half-columns; theory columns match by exact `startTime`/`endTime`). This matching logic is small (~15-20 lines) and is being duplicated rather than imported, per the Design Approach decision below.
4. Look up that slot's ID in the map from step 2:
   - No entry (or lunch column) → empty cell, same inset styling `FPSlotMatrixTimetable` uses for unoccupied cells.
   - Exactly one pick → normal cell: course's flat color background, course code + professor name, same visual language as `FPSlotMatrixTimetable`'s occupied-cell rendering (mono course code, `readableTextColor` for contrast — this helper can be imported as-is from `slot-matrix-timetable.tsx`, it's a pure color-math utility with no schedule dependency).
   - Two or more picks → **clash cell**: split-diagonal background using both (or the first two) courses' colors, plus a small warning glyph, matching the treatment prototyped in brainstorming. No click handler, no hover interaction beyond a plain `title` tooltip listing the colliding course codes (a zero-cost native affordance, not an interactive feature).

**Why not reuse `FPSlotMatrixTimetable`/`buildMatrixCells` directly:** `buildMatrixCells` resolves a slot's occupant with `.find()` against `schedule.selections` — for a real generated schedule this is safe (the generator guarantees no two selections ever share a slot), but it means the function has no concept of "multiple things claimed one slot," which is exactly what this feature needs to show. Extending `buildMatrixCells` to report all matches would touch a utility shared with the classic app's own timetable rendering to serve a `/new`-only feature; synthesizing a fake schedule object to reuse `FPSlotMatrixTimetable` unmodified would still hit the same `.find()` gap and require bolting an external overlay onto a component that doesn't expose individual cells. Keeping this entirely local and independent avoids both, at the cost of the modest, stable, duplicated grid-shape/cell-matching logic described above.

**Status indicator:** an `FPBadge tone="warn"` reading "Draft preview · not generated" sits above the grid, in the same position/row the current preview's "One possible layout · nothing locked" `FPLabel` occupies today. This reuses the app's existing warn-badge convention (already used for "Stale"/"Unverified professor") rather than introducing new visual language for "provisional."

**Empty-courses state:** out of scope (Non-Goals) — the existing skeleton-grid-behind-a-message treatment for zero courses stays as-is for this spec; only the *populated* preview's grid shape and clash handling change. (If the skeleton grid's own shape looks inconsistent once the real grid is in place next to it, that's fair game for the empty-states follow-up spec, not this one.)

## Files Touched

- `src/features/planner/fp/FPCoursesPane.tsx` — re-weight rail sizing constants; move `FPCourseList`'s list rendering into the rail column; right column renders only the new grid component.
- `src/features/planner/fp/FPWeekSoFarPreview.tsx` — full internal replacement (new grid-building logic per Design §2); external props unchanged. Consider a rename to `FPLiveSlotMatrix` (file + export) as part of this work, updating the one import site in `FPCoursesPane.tsx` accordingly — a plan can decide whether the rename is worth the churn versus keeping the existing filename with new internals.
- No changes to `src/components/fp-ui/slot-matrix-timetable.tsx`, `src/features/results/timetableMatrix.ts`, `src/app/new/results/*`, `src/app/new/compare/*`, or anything in the classic app.

## Verification

No test framework exists in this repo (confirmed during the prior visual-system pass). Verification is:
- `npx tsc --noEmit` clean.
- Live, in the Claude Browser pane at `/new/planner` (Courses tab): add 2+ courses whose first professor options share a slot, confirm the grid shows the real FFCS day/THEORY/LAB shape (not hourly blocks), confirm the shared slot renders the clash treatment, confirm a non-colliding course renders as a normal flat-colored cell matching `FPSlotMatrixTimetable`'s visual language, confirm the "Draft preview · not generated" badge is present, confirm "Find my weeks" still navigates to `/new/results` unchanged.
- Resize the rail via the existing drag handle and confirm it still persists to `localStorage` and re-clamps within the new `[340, 480]` range.
- Spot-check `FPCourseList`'s rendering at the new narrower rail width for any layout breakage (see the implementation-time risk noted in Design §1).
- Check console for errors in both dark and light theme.
