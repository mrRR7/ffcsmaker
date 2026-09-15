# FP-UI Primitives Reference — "FFCS Planner" skin

Design-system components for the `/new/*` routes, in `src/components/fp-ui/`. These read only `fp-*` tokens (`src/app/new/fp-tokens.css`) and never leak outside the `.fp-root` scope. Mirrors `docs/ui-primitives.md`'s convention for the classic `src/components/ui/` library — see that file for the pattern.

| Component | File | One-line spec |
|---|---|---|
| `FPButton` | `button.tsx` | The only action control. `variant`: primary/secondary/ghost, `size`: sm/md. Mono uppercase, `.14em` tracking, exact hover/disabled states from the design handoff's own Button spec. |
| `FPCard` | `card.tsx` | Flat hairline surface, no shadow. `selected` boolean → accent border + accent-wash fill. |
| `FPBadge` | `badge.tsx` | Mono chip for terms/scores/flags. `tone`: neutral/accent/warn/danger, optional `pill`. |
| `FPLabel` | `label.tsx` | The signature mono-uppercase micro-label. Non-interactive text primitive. `tone`: dim/accent/strong/warn. |
| `FPMetricRun` | `metric-run.tsx` | Joins `items` with the house `·` separator, mono, dim. |
| `FPPanel` | `panel.tsx` | Labelled region / outer band. Optional `title` (string renders as `FPLabel`) and `action` slot in the header row. |
| `FPCheckbox` | `checkbox.tsx` | 20×20 toggle. Unticked = border-strong box; ticked = accent border + accent-wash-strong fill + unicode `✓`. Labels passed through verbatim — never prettify snake_case. |
| `FPNote` | `note.tsx` | 2px accent-left-bar helper text. `tone="warn"` for a warn-colored note. |
| `FPNavBar` | `nav-bar.tsx` | Top band: wordmark + optional `nav`/`actions` slots. No logo — plain type wordmark only. |
| `FPStepNav` | `step-nav.tsx` | Numbered step tabs (`01 COURSES / 02 PREFERENCES / 03 RESULTS`). `steps[].status`: upcoming/active/done. |
| `FPCourseRow` | `course-row.tsx` | Rail entry with a 2px accent LEFT bar — the system's one deliberate left-accent use. `tone`: default/accent/warn. |
| `FPScheduleGrid` / `FPScheduleRowLabel` / `FPScheduleLunchRow` | `schedule-grid.tsx` | Orientation-agnostic weekly/period matrix shell (mono gutter + N columns). Backs both simplified preview grids and the real `timetableMatrix.ts` THEORY/LAB matrices. |
| `FPSlotMatrixTimetable` | `slot-matrix-timetable.tsx` | The real generated-timetable grid — a structural port of the classic `SlotMatrixTimetable` (day rows split into THEORY/LAB sub-rows, rowspan'd Start/End period columns, Bhopal single-row variant). This is what every real generated schedule uses (Results, Compare), never the simplified day-column preview. `showHeader` (default `true`) toggles its own score/metrics header band — set `false` when the caller already renders that information itself, to avoid showing it twice. |
| `FPScheduleBlock` | `schedule-block.tsx` | One grid cell. Takes the course's own configured `color`/`textColor` (real per-course color-coding is preserved, not replaced by the mockups' single-hue depth family) or a `depth` (1-4) for illustrative grids; `gap` and `lunch` render their respective treatments. |
| `FPComboCard` | `combo-card.tsx` | Ranked-solution card: eyebrow + score + optional title/meta/thumbnail/footer. Used by Results' combo row, Compare, Saved. |
| `FPSlotTable` / `FP_EMPTY_CELL` | `slot-table.tsx` | Hairline data table; empty cells default to an em dash. |

## Note on per-course color

The design system's own placeholder data uses one accent hue at four depths ("brighter = earlier in the day"). The real app already lets a student assign an **arbitrary color per course** (`course.color`, set via a color-picker in `CourseBuilder`) so they can tell courses apart at a glance — that's existing, working functionality, not a mockup convention. `FPScheduleBlock` preserves it: pass the course's real `color`/`textColor` wherever real schedule data is rendered, and reserve the `depth` prop for non-functional illustrative grids (e.g. the landing page's sample week) that have no real course behind them.
