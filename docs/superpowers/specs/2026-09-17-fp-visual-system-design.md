# FFCS Planner (`/new` skin) — Visual System Redesign

## Context

External feedback (an 85-point critique, summarized in full in the originating conversation) identified the `/new` skin as reading like "AI-generated dark developer SaaS" rather than a purpose-built FFCS product. The critique spans two very different kinds of problem:

1. **Visual system** — typography (monospace/uppercase/tracking overuse), color (green used for every semantic role at once), containers (nearly everything boxed), and icon usage. This is a retouch of the existing skin's surface — no new behavior, no IA changes.
2. **Structural/content** — copy voice, navigation/IA, panel layout, the "week so far" preview's generic hourly grid vs. real FFCS slots, empty-state design, and control hierarchy (Search/Paste/Import/Manual). This is a separate effort the user is handling independently.

This spec covers **only the visual system** (item 1). Structural/content changes are explicitly out of scope here.

**Non-goals for this spec**: no changes to navigation structure or route organization, no copy/microcopy rewrites, no panel-layout restructuring, no changes to the actual timetable's slot-matrix grid (day × THEORY/LAB × period), no changes to the "week so far" preview's underlying data model (hourly blocks vs. real slots). Those are the structural/content pass.

The result should keep the dark/premium direction and the single green accent — the fix is disciplined **restraint**, not a different aesthetic.

**Invariant**: no new color, spacing, radius, shadow, or typography token may be introduced during this pass unless an existing token cannot express the requirement. The two additions in this spec (`--surface-selected`, `--border-selected`) are the only tokens this pass expects to add — everything else routes through what already exists in `fp-tokens.css`. The point of this pass is to reduce visual improvisation, not add a new axis of it.

## Goals

- Typography carries real hierarchy (size/weight/case) instead of one mono-uppercase-tracked treatment applied almost everywhere.
- Green is reserved for a small set of meaningful moments (primary action, affirmative confirmation, meaningful product-generated recommendations) instead of marking every semantic role (selection, navigation, status, branding) with the same color.
- Borders exist only where they communicate real structure (the timetable grid, a focus state) — not as a default way to draw every piece of UI.
- Icons appear only where they aid real recognition/scanning (primary nav, compact icon-only controls) — not decoratively on every button.

## Design

### 1. Typography

Retire `.fp-label` as a blanket utility class. It currently bundles three things (`font-family: mono`, `text-transform: uppercase`, `letter-spacing: 0.14em`) and gets applied almost everywhere — nav, buttons, tabs, badges, status text, section headers. Replace with three distinct, narrow-purpose classes in `src/app/new/fp-tokens.css`:

```css
/* the interface's normal voice — the default for ~90-95% of text */
.fp-text {
  font-family: var(--font-body);
  letter-spacing: normal;
  text-transform: none;
}

/* small secondary labels/kickers only — not a default */
.fp-eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-micro); /* reuse the existing 11px token, no new size */
  font-weight: var(--weight-semibold);
  letter-spacing: 0.07em; /* down from 0.14em */
  text-transform: uppercase;
}

/* actual FFCS tokens/codes and compact numeric data */
.fp-code {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

**Where each applies:**
- `.fp-text` — navigation, page/section headings (still set in `--font-display` for h1-h4 per existing rules, just no mono/uppercase), buttons, tabs, badges, status labels, empty states, helper text, semester/campus/theme controls, ranking controls, dialogs, notifications.
- `.fp-eyebrow` — used sparingly: a section kicker sitting above a heading, at most a small handful of places. Not applied to nav, buttons, or general metadata.
- `.fp-code` — slot codes (`TB1`, `L43+L44`, `A1`, `S15`), course codes (`BCSE101`, `CSE3090`), the credit counter (`3 / 27 CR`), and any other compact numeric/token display that reads as structured FFCS data rather than prose.

**Component-level changes:**
- `FPLabel` (`src/components/fp-ui/label.tsx`) — currently renders `.fp-label` (mono/uppercase/tracked) by default and is used almost everywhere for metadata ("Your courses · 3", "Fall Semester 2026-27 · Active catalog", etc.). It changes to render `.fp-text` at a small size (`--text-small` or `--text-micro` depending on current usage) by default. Add an explicit opt-in variant (e.g. `variant="eyebrow"`) for the rare cases that want the kicker treatment — do not make eyebrow the default anywhere it isn't today used as a deliberate section kicker.
- `FPStepNav` (`src/components/fp-ui/step-nav.tsx`) — drop the `01`/`02` number prefixes entirely. Steps render as plain `.fp-text` labels ("Courses", "Preferences").
- `FPBadge` (`src/components/fp-ui/badge.tsx`) — label text moves from `.fp-label` to `.fp-text`.
- `FPButton` (`src/components/fp-ui/button.tsx`) — label text moves from `.fp-label` to `.fp-text`.
- Real timetable and preview components (`slot-matrix-timetable.tsx`, `schedule-block.tsx`, `schedule-grid.tsx`, `slot-table.tsx`) and anywhere a course/slot code renders (`FPCourseList.tsx`, `FPSearchTab.tsx`, `FPCreditSummary.tsx`) — these keep `.fp-code` for the codes themselves; any surrounding chrome (headers, labels) in those same components moves to `.fp-text`.

### 2. Color

Add two genuinely neutral tokens to `fp-tokens.css` (dark and light theme blocks) — no accent green in either:

```css
--surface-selected: /* neutral, lighter than --bg-raised — the top of the surface ladder, reserved for "currently selected" */;
--border-selected: /* its own literal value, initially equal to --border-strong's — a genuinely distinct token, not an alias, so selection can be tuned independently of the general "strong border" role later */;
```

Keep the existing `--bg-page → --bg-surface → --bg-raised` scale and `--text-strong` (primary) / `--text-body` (secondary) / `--text-dim` (muted) — these already express the right hierarchy, they're just under-used relative to how much green currently does the same job.

**The rule**: green = action, affirmative confirmation, or a meaningful product-generated recommendation. Neutral `--surface-selected`/`--border-selected` = "this is where you are" / "this is selected." Plain text-weight contrast = general hierarchy.

**Component-by-component re-mapping:**

| Component | Current | New |
|---|---|---|
| Nav active item (`fp-shell.tsx`) | Green wash + accent border pill (`layoutId="fp-nav-pill"`), accent text | No pill/border. `--surface-selected` background, `text-strong`, icon follows text color (no accent tint on active route) |
| Step-nav active tab (`step-nav.tsx`) | `border-b-2 border-b-fp-accent` + accent wash | `--surface-selected` background, `text-strong`, no border |
| Selected card (ranking profile, combo cards — `card.tsx`) | `border-fp-border-accent` + accent wash | `--surface-selected` background + neutral `--border-selected` |
| Active course-add tab (Search/Paste/Import/Manual — `FPCoursesPane.tsx`) | `border-fp-border-accent` + accent wash | `--surface-selected`, no accent |
| Checkbox checked (`checkbox.tsx`) | Accent border + accent-wash-strong fill + accent check icon | **Unchanged — stays green.** Ticking a professor option is an affirmative user action, not navigation/selection, so accent retains a real semantic role here. |
| Badges (`badge.tsx`) | `tone="accent"` used broadly (semester pill, constraints count, best/recommended) | Default neutral, no border. Green reserved for badges that are genuinely meaningful product-generated recommendations — "Best overall," "Recommended." Semester pill and constraints-count badge become neutral (informational, not a recommendation). |
| Links | Mixed | Neutral by default, green on hover; an action-flavored link (e.g. "Create share link") may stay accent since it functions as a CTA |
| Primary CTA buttons | Green | **Unchanged — stays green.** This is exactly where accent should carry weight. |

### 3. Borders and containers

Default posture flips from "border by default" to "border only when it answers a real 'where does this region end' question."

- **Buttons** (`button.tsx`) — no default border on any variant. Secondary distinguishes via a raised background fill instead of an outline (not an outline at lower contrast — removed, not dimmed).
- **Inputs / search / selectors** (`fpInputClass` in `FPPrefControls.tsx`, the search bar in `FPSearchTab.tsx`, time inputs, selects) — drop the permanent border; rely on the `bg-inset` surface step for definition. A subtle border appears only on focus (interactive controls still need affordance — this is the one exception, and even there it's neutral, never green).
- **Cards** (`card.tsx`) — no border by default; the existing `--shadow-raised` inset highlight (added in the earlier flatness-fix pass) is enough and isn't a "boxed rectangle," so it stays. Selected cards get `--border-selected` (neutral) per the color table above.
- **Badges** (`badge.tsx`) — no border, ever. Typography + optional neutral surface wash carries it.
- **Empty states** (course-list empty box, search "type at least 2 characters," `FPWeekSoFarPreview`'s "add a course to see a live preview" message, `ZeroResultsFP`) — drop the enclosing bordered box; the message sits directly on the surrounding surface.
- **The Courses/Preview resizable divider** (`FPCoursesPane.tsx`) — currently a permanently visible `bg-fp-border-default` line that brightens to accent on hover. Becomes invisible at rest (whitespace only) — the drag hit-area and functionality are unchanged, a hint of line appears only on hover/drag. This is a deliberate reversal of a treatment built earlier this session, per the same "functional vs. decorative" rule: the affordance only needs to be visible when it's actionable.
- **Timetable grid lines, table headers, slot boundaries** (`slot-matrix-timetable.tsx`, `schedule-grid.tsx`, `slot-table.tsx`) — **unchanged.** These communicate real schedule structure and are explicitly out of scope for removal.

### 4. Icons

- **Keep, unchanged in placement**: primary top nav (Home/Plan/Results/Compare/Saved/Settings) in `fp-shell.tsx` — real scanning value across persistent destinations. Per the color section, active-route icons stop taking an accent tint; they follow the same neutral text-color rule as the label.
- **Remove**: leading icons on the Search Catalog / Paste Text / Import File / Manual Entry tab buttons (`FPCoursesPane.tsx`), and on "Delete" / "Delete all" buttons (`FPCourseList.tsx`, `SavedWeekCard.tsx`) — text alone is sufficient at that size/context.
- **Keep**: compact icon-only controls with no room for text and where the icon is unambiguous — the lock/avoid/duplicate/delete glyphs on a professor-option row (`FPCourseList.tsx`), the × on a blocked-window chip (`FPBlockedWindowsPanel.tsx`), the "Verified" checkmark next to a catalog-verified course code (`FPSearchTab.tsx`).

## Files touched

- `src/app/new/fp-tokens.css` — new typography classes (`.fp-text`, `.fp-eyebrow`, `.fp-code`), retire `.fp-label` as a default, new `--surface-selected`/`--border-selected` tokens (dark + light).
- `src/components/fp-ui/label.tsx` — default rendering changes from mono/uppercase to `.fp-text`; add explicit eyebrow opt-in.
- `src/components/fp-ui/step-nav.tsx` — drop number prefixes, neutral selected-state instead of accent border/wash.
- `src/components/fp-ui/badge.tsx` — drop border, drop default mono/uppercase, re-triage which badges default to `tone="accent"` vs neutral.
- `src/components/fp-ui/button.tsx` — drop default borders, `.fp-text` labels.
- `src/components/fp-ui/card.tsx` — drop default border, neutral selected treatment.
- `src/components/fp-ui/fp-shell.tsx` — nav active state (remove green pill, add neutral surface-selected), campus/semester/theme controls typography, semester pill becomes neutral.
- `src/components/fp-ui/checkbox.tsx` — no change (confirmed to stay as-is).
- `src/features/planner/fp/FPCoursesPane.tsx` — tab-button active state (neutral, not accent), remove tab icons, resizable divider becomes invisible-at-rest.
- `src/features/planner/fp/FPCourseList.tsx`, `FPSearchTab.tsx`, `FPCreditSummary.tsx` — course/slot codes confirmed on `.fp-code`; remove decorative icons from Delete/tab-adjacent buttons where applicable.
- `src/features/planner/fp/FPPrefControls.tsx`, `FPWeekSoFarPreview.tsx`, `src/app/new/results/ZeroResultsFP.tsx` — input borders, empty-state box removal.
- Broader sweep across `src/app/new/**` and remaining `src/components/fp-ui/**`/`src/features/planner/fp/**` files for any remaining `.fp-label` usage, accent-wash-on-selection patterns, and decorative borders not called out individually above — the principles in this spec apply system-wide, not only to the files named here.

## Verification

- `npx tsc --noEmit` clean.
- Grep the codebase for `fp-label` (class usage, not the `FPLabel` component name) — the only remaining match should be inside `label.tsx` itself, on the compatibility path backing the explicit `variant="eyebrow"` opt-in. Any other match means the old treatment is still being sprinkled around rather than genuinely retired.
- Live pass across Landing, Planner (Courses + Preferences), Results, Compare, Saved, Settings in both dark and light theme: confirm nav/step-nav/tab-active states read as neutral selection (not green), confirm buttons/inputs/cards/badges have no default border, confirm the resizable divider is invisible at rest and appears on hover/drag, confirm slot/course codes still render in monospace, confirm the primary CTA and checkbox-checked states are still green, confirm "Best overall"/"Recommended" badges are still green and semester/constraints badges are not.
- Confirm the real timetable grid (`slot-matrix-timetable.tsx`) and preview grid (`schedule-grid.tsx`) are visually unchanged — this spec must not touch them.
- Spot-check that no page reads as "boxed" — most surfaces should differentiate via background-color step and spacing alone.
