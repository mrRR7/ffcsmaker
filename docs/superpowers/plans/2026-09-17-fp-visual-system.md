# FP Visual System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Retire the mono/uppercase/tracked/green-everywhere/boxed-everything visual language of the `/new` FFCS Planner skin in favor of a disciplined three-tier typography system, a neutral "selected" state distinct from green, and borders used only where they communicate real structure.

**Architecture:** This is a token-and-primitive-first migration: add the new CSS classes/tokens once in `fp-tokens.css`, update each shared `fp-ui` primitive component to consume them, then sweep the remaining pages/features that build directly on raw Tailwind classes (inputs, tab buttons, empty-state boxes) rather than a shared primitive. Every step is additive-then-subtractive: new classes/tokens are added alongside the old ones first, consumers migrate one at a time, and the old `.fp-label` default is only removed once nothing depends on it (Task 12).

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS (with CSS custom properties for the `fp-*` design tokens), `class-variance-authority` for component variants, `framer-motion` for existing motion (unchanged by this plan).

**Spec:** `docs/superpowers/specs/2026-09-17-fp-visual-system-design.md`

## Global Constraints

- **No new tokens** unless an existing one cannot express the requirement. This plan introduces exactly two: `--surface-selected` and `--border-selected` (dark + light). Every other change routes through tokens that already exist in `fp-tokens.css`.
- **Do not touch**: `slot-matrix-timetable.tsx`, `schedule-grid.tsx`, `slot-table.tsx`'s structural grid/row borders, the checkbox component (`checkbox.tsx`), or anything outside `/new` (the classic app at `src/app/`, `src/features/*` non-`fp` directories, `src/components/ui/*`).
- **No test framework exists in this repo** (`package.json` has no jest/vitest/testing-library — confirmed by grep). Every task's verification step uses `npx tsc --noEmit`, targeted `grep` checks for the invariants the spec calls out, and a live check via the Claude Browser pane (`mcp__Claude_Browser__*` tools) against the dev server at `http://localhost:3000`. Start the dev server once with `npm run dev` (or reuse the one already running) before Task 1's verification.
- **Every task commits its own change** — do not batch multiple tasks into one commit.
- Course/slot codes that must render in `.fp-code` (monospace): slot labels like `TB1`, `L43+L44`, `A1`, `S15`; course codes like `BCSE101`, `CSE3090`; the credit counter `3 / 27 CR`.

---

## Task 1: Token & typography-class foundation

**Files:**
- Modify: `src/app/new/fp-tokens.css`

**Interfaces:**
- Produces: three CSS classes (`.fp-text`, `.fp-eyebrow`, `.fp-code`) and two new custom properties (`--surface-selected`, `--border-selected`, defined in both `.fp-root` and `.fp-root.light`) that every later task consumes. `.fp-label` keeps its current visual behavior unchanged in this task — nothing consumes the new classes yet, so this step must not change what the app looks like.

- [x] **Step 1: Add the three typography classes**

In `src/app/new/fp-tokens.css`, immediately after the existing `.fp-label` block (currently lines 180–186), add:

```css
/* the interface's normal voice — sans, normal case, normal tracking.
   the default for ~90-95% of interface text: nav, buttons, tabs,
   badges, status text, headings, helper text, dialogs. */
.fp-text {
  font-family: var(--font-body);
  letter-spacing: normal;
  text-transform: none;
}

/* small secondary labels/kickers only — not a default. used sparingly
   for a section eyebrow sitting above a heading. */
.fp-eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

/* actual FFCS tokens/codes and compact numeric data — slot codes,
   course codes, credit counts. the only place monospace survives. */
.fp-code {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

- [x] **Step 2: Add the two neutral selection tokens**

In the same file, inside the `.fp-root` block (dark theme, after the line `--border-accent: var(--accent);` around line 48), add:

```css
  --surface-selected: #232b31;
  --border-selected: #3f4c54;
```

Inside the `.fp-root.light` block (after `--border-accent: #25794a;` around line 163), add:

```css
  --surface-selected: #e2ddd0;
  --border-selected: #b9ae9c;
```

(Reasoning for the literal values: `--surface-selected` sits one perceptible step lighter than `--bg-raised` (`#1b2228` dark / `#ffffff` light — light theme already tops out at white, so `#e2ddd0` sits between `--bg-page` `#efede7` and `--border-strong` `#ada393` as a warm neutral highlight) so a selected item is visibly the brightest neutral surface in the stack. `--border-selected` starts at a literal value close to `--border-strong` but is its own token — not an alias — so it can be tuned independently later without touching the general "strong border" role.)

- [x] **Step 3: Verify no visual change yet**

Run: `npx tsc --noEmit`
Expected: clean, no output (this is a CSS-only change; this check just confirms nothing else broke).

Start the dev server if not already running (`npm run dev`), then using the Claude Browser pane tools, navigate to `http://localhost:3000/new` and take a screenshot. Expected: pixel-identical to before this change — nothing in the app yet references `.fp-text`, `.fp-eyebrow`, `.fp-code`, `--surface-selected`, or `--border-selected`, so nothing should look different.

- [x] **Step 4: Commit**

```bash
git add src/app/new/fp-tokens.css
git commit -m "Add fp-text/fp-eyebrow/fp-code classes and neutral selection tokens

Additive only — nothing consumes these yet. Part of the visual system
redesign in docs/superpowers/specs/2026-09-17-fp-visual-system-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: FPLabel — typography default + eyebrow opt-in

**Files:**
- Modify: `src/components/fp-ui/label.tsx`

**Interfaces:**
- Consumes: `.fp-text`, `.fp-eyebrow` classes from Task 1.
- Produces: `FPLabel` keeps its existing prop signature (`tone?: "dim" | "accent" | "strong" | "warn"`) and adds `variant?: "text" | "eyebrow"` (default `"text"`). Every existing call site (`<FPLabel tone="...">`) keeps compiling unchanged and now renders plain text instead of mono/uppercase/tracked — this is the single highest-leverage change in the plan since `FPLabel` is used for most metadata app-wide.

- [x] **Step 1: Update FPLabel to default to `.fp-text`, add the eyebrow opt-in**

Replace the full contents of `src/components/fp-ui/label.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Label — small metadata/status text. Defaults to the interface's normal
 * typographic voice (sans, normal case). Pass `variant="eyebrow"` only for
 * a genuine section kicker sitting directly above a heading — that's the
 * one place the old mono-uppercase-tracked treatment survives, and it
 * should stay rare.
 */
export interface FPLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "dim" | "accent" | "strong" | "warn";
  variant?: "text" | "eyebrow";
}

const toneMap = {
  dim: "text-fp-text-dim",
  accent: "text-fp-accent",
  strong: "text-fp-text-strong",
  warn: "text-fp-warn"
} as const;

export function FPLabel({ className, tone = "dim", variant = "text", ...props }: FPLabelProps) {
  return (
    <span
      className={cn(
        variant === "eyebrow" ? "fp-eyebrow" : "fp-text text-[var(--text-small)]",
        toneMap[tone],
        className
      )}
      {...props}
    />
  );
}
```

Note the size change: the old default was always `--text-micro` (11px) regardless of context, because that size was doing double duty as "this is a mono label" sizing. Under the new system, `.fp-eyebrow` supplies its own `--text-micro` sizing for the rare kicker case, and the default text path uses `--text-small` (13px) since it's now reading as normal small body text, not a shouty micro-label. If a specific existing call site looks too large after this change, that call site should pass a `text-[var(--text-micro)]` override via `className`, not change the component default.

- [x] **Step 2: Find and convert genuine section-kicker call sites to `variant="eyebrow"`**

Run: `grep -rn "FPLabel tone=\"accent\"" src/app/new src/features/planner/fp src/components/fp-ui`

For each match, open the file and check: does this `FPLabel` sit immediately above an `<h1>`/`<h2>`/`<h3>` heading as a standalone kicker (e.g. the word "Preferences" or "Results" alone, above a bigger heading)? If yes, add `variant="eyebrow"`. If it's inline status text (e.g. "Best score {n}", "One possible layout · nothing locked", "Active catalog"), leave it as the new default (`variant="text"`, i.e. no change needed beyond what Step 1 already did).

Known genuine kicker call site to convert now — `src/components/fp-ui/fp-shell.tsx`, inside `FPCampusGate`:

```tsx
        <FPLabel tone="accent">FFCS Planner</FPLabel>
        <h1 className="mt-3 font-fp-display text-[var(--text-display)] font-bold tracking-[-0.01em] text-fp-text-strong">
          Which campus are you from?
        </h1>
```

Change the first line to:

```tsx
        <FPLabel tone="accent" variant="eyebrow">FFCS Planner</FPLabel>
```

Leave every other `grep` match from this step as plain text unless it fits the same "standalone kicker directly above a heading" pattern — most will not, and should NOT be converted (the spec is explicit that eyebrow stays rare).

- [x] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new` and screenshot. Expected: most small metadata text across the page (nav wordmark subtitle, footer "Not affiliated with VIT University", any status text) now renders in plain sans-serif instead of mono/uppercase/tracked. Navigate to a campus-gate view (clear campus selection via Settings, or check `/new/planner` while unauthenticated on a campus) and confirm "FFCS Planner" above "Which campus are you from?" still reads as a small uppercase kicker (it now uses `.fp-eyebrow`, visually similar but sans-serif and less tracked than before).

Check the browser console for errors: `mcp__Claude_Browser__read_console_messages` with `onlyErrors: true`. Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/components/fp-ui/label.tsx
git commit -m "FPLabel defaults to plain text; add eyebrow opt-in for section kickers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: FPBadge — typography default, drop border, tone re-triage, mono opt-in

**Files:**
- Modify: `src/components/fp-ui/badge.tsx`
- Modify: `src/components/fp-ui/fp-shell.tsx` (semester pill tone)
- Modify: `src/features/planner/fp/FPCreditSummary.tsx` (credit count → mono)

**Interfaces:**
- Consumes: `.fp-text`, `.fp-code` from Task 1.
- Produces: `FPBadge` gains a `mono?: boolean` prop (default `false`). Its `tone="neutral"` default no longer renders a border. Existing `tone`/`pill` props are unchanged.

- [x] **Step 1: Update FPBadge — drop border, plain text default, mono opt-in**

Replace the full contents of `src/components/fp-ui/badge.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Badge — small status/metadata chip. No border by default; typography and
 * an optional tone wash carry the distinction. `tone="accent"` (green) is
 * reserved for genuinely meaningful states — a product-generated
 * recommendation ("Best overall", "Recommended"), not general information
 * (a semester pill, a constraint count). Pass `mono` only for a badge whose
 * content is an actual FFCS code or compact numeric value.
 */
export interface FPBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "warn" | "danger";
  pill?: boolean;
  mono?: boolean;
}

const toneMap = {
  neutral: "text-fp-text-dim",
  accent: "text-fp-accent",
  warn: "text-fp-warn",
  danger: "text-fp-danger"
} as const;

const toneWash = {
  neutral: undefined,
  accent: "var(--accent-wash)",
  warn: "var(--warn-wash)",
  danger: "var(--danger-wash)"
} as const;

export function FPBadge({ className, tone = "neutral", pill = false, mono = false, style, ...props }: FPBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-[10px] py-[5px] text-[var(--text-micro)]",
        mono ? "fp-code" : "fp-text",
        pill ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-sm)]",
        toneMap[tone],
        className
      )}
      style={{ backgroundColor: toneWash[tone], ...style }}
      {...props}
    />
  );
}
```

Note what changed from before: the `border` class and each tone's `border-fp-border-*` color are gone entirely (badges no longer have a visible border in any tone, per the spec's borders section). The wash background (`toneWash`) is unchanged — a badge can still have a soft tinted background, just no outline.

- [x] **Step 2: Re-triage which existing badges use `tone="accent"`**

Run: `grep -rn 'tone="accent"' src/app/new src/features/planner/fp src/components/fp-ui | grep -i badge`

(If that combined grep is awkward given multi-line JSX, instead run `grep -rln "FPBadge" src/app/new src/features/planner/fp` to list files using `FPBadge` at all, then open each and inspect every `<FPBadge tone="accent" ...>` call site.)

Apply this rule: keep `tone="accent"` only where the badge represents a meaningful product-generated recommendation (e.g. "Best overall" in `src/app/new/results/page.tsx`, "Recommended" in `src/app/new/compare/CompareWeekCard.tsx`) or a genuinely positive/verified state. Change to `tone="neutral"` anywhere it's purely informational — this specifically includes:

In `src/components/fp-ui/fp-shell.tsx`, the semester pill:

```tsx
          <FPBadge tone="accent" pill>
            Fall 2026
          </FPBadge>
```

becomes:

```tsx
          <FPBadge tone="neutral" pill>
            Fall 2026
          </FPBadge>
```

And the constraints-active badge (wherever it appears in `src/app/new/planner/page.tsx`'s action row — search for `constraints active`):

```tsx
<FPBadge tone={activeConstraintCount > 0 ? "accent" : "neutral"}>
  {activeConstraintCount} constraints active
</FPBadge>
```

becomes unconditionally neutral (a constraint count is informational, not an achievement):

```tsx
<FPBadge tone="neutral">
  {activeConstraintCount} constraints active
</FPBadge>
```

Leave "Best overall" and "Recommended" badges as `tone="accent"` — do not change those.

- [x] **Step 3: Apply `mono` to the credit counter**

In `src/features/planner/fp/FPCreditSummary.tsx`, change:

```tsx
  return (
    <FPBadge tone={tone}>
      {totalCredits} / {VIT_CREDIT_CAP} CR{isOver ? " · OVER" : ""}
    </FPBadge>
  );
```

to:

```tsx
  return (
    <FPBadge tone={tone} mono>
      {totalCredits} / {VIT_CREDIT_CAP} CR{isOver ? " · OVER" : ""}
    </FPBadge>
  );
```

- [x] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new` — confirm the header's "Fall 2026" pill no longer has a green border/wash (plain neutral chip). Navigate to `/new/planner` (with a campus selected) and confirm the constraints-count badge in the action row is neutral regardless of count, and the credit counter (e.g. "0 / 27 CR") renders in monospace. Navigate to `/new/results` with at least one generated schedule and confirm the "Best overall" badge is still green. Check console for errors (`onlyErrors: true`).

- [x] **Step 5: Commit**

```bash
git add src/components/fp-ui/badge.tsx src/components/fp-ui/fp-shell.tsx src/features/planner/fp/FPCreditSummary.tsx
git commit -m "FPBadge: drop default border, plain-text default, mono opt-in

Re-triage tone=accent to only genuinely meaningful states (Best
overall, Recommended) — semester pill and constraints count move to
neutral. Credit counter now uses the mono opt-in.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: FPButton — plain text, drop default borders

**Files:**
- Modify: `src/components/fp-ui/button.tsx`

**Interfaces:**
- Consumes: `.fp-text` from Task 1.
- Produces: `FPButton`'s existing `variant`/`size`/`loading` props are unchanged; only the underlying classes change. `secondary` variant no longer has a visible border — it distinguishes via a raised background fill instead.

- [x] **Step 1: Update the button variants**

In `src/components/fp-ui/button.tsx`, change the `cva` base class (currently starts with `"fp-label inline-flex..."`) to start with `"fp-text inline-flex..."` instead — i.e. replace the literal string `"fp-label "` with `"fp-text "` at the start of the base className argument.

Then change the `variant` map from:

```tsx
      variant: {
        primary: "bg-fp-accent text-fp-text-on-accent font-medium hover:bg-fp-accent-bright",
        secondary:
          "bg-transparent text-fp-text-body border-fp-border-strong hover:bg-fp-bg-raised hover:border-fp-accent",
        ghost: "bg-transparent text-fp-text-dim hover:text-fp-text-body"
      },
```

to:

```tsx
      variant: {
        primary: "bg-fp-accent text-fp-text-on-accent font-medium hover:bg-fp-accent-bright",
        secondary: "bg-fp-bg-raised text-fp-text-body hover:bg-fp-bg-inset",
        ghost: "bg-transparent text-fp-text-dim hover:text-fp-text-body"
      },
```

(`border border-transparent` stays in the base class — it's harmless since no variant sets a visible border color anymore, and keeping it avoids a layout shift on any state that might still set a border, like `disabled:border-fp-border-default` which the base class already has for the disabled state — leave that disabled-state border as-is, since a disabled control benefits from a boundary and this isn't a "decorative" border, it's communicating an inert-but-present control.)

- [x] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner` and find a secondary button (e.g. "Cancel" in a dialog, or the theme toggle). Confirm it now reads as a filled raised chip with no outline, and the label text is plain sans-serif, not mono/uppercase. Confirm the primary "Find my weeks" button is unchanged (still solid green). Check console for errors.

- [x] **Step 3: Commit**

```bash
git add src/components/fp-ui/button.tsx
git commit -m "FPButton: plain text labels, drop secondary variant's border

Secondary distinguishes via a raised background fill instead of an
outline, matching the spec's 'no default border on buttons' rule.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: FPCard — drop default border, neutral selected state

**Files:**
- Modify: `src/components/fp-ui/card.tsx`

**Interfaces:**
- Consumes: `--surface-selected`, `--border-selected` from Task 1.
- Produces: `FPCard`'s `selected`/`padding`/`onClick` props are unchanged; only the underlying styling changes.

- [x] **Step 1: Update FPCard**

Replace the full contents of `src/components/fp-ui/card.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Card — flat surface. No border by default; the existing --shadow-raised
 * inset highlight (not a boxed rectangle) supplies enough depth on its own.
 * `selected` = neutral --surface-selected background + neutral
 * --border-selected — never accent green, since selection isn't the same
 * signal as a meaningful action or recommendation.
 */
export interface FPCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-[9px]",
  md: "p-4",
  lg: "p-5"
} as const;

export const FPCard = React.forwardRef<HTMLDivElement, FPCardProps>(
  ({ className, selected, padding = "md", onClick, ...props }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] bg-fp-bg-surface",
        selected ? "border border-[var(--border-selected)]" : "border border-transparent",
        onClick && "cursor-pointer transition-transform duration-[var(--dur-fast)] active:scale-[0.98]",
        paddingMap[padding],
        className
      )}
      style={{
        boxShadow: "var(--shadow-raised)",
        ...(selected ? { backgroundColor: "var(--surface-selected)" } : null)
      }}
      {...props}
    />
  )
);
FPCard.displayName = "FPCard";
```

(`border border-transparent` on the unselected state keeps the box model identical between selected/unselected — no layout shift when a card becomes selected — while rendering no visible line.)

- [x] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner` and confirm the ranking-profile dropdown in the Courses page's action row still works (it's a plain `<select>`, unaffected by this task, but worth a quick sanity check since it sits next to `FPCard`-based controls). Then navigate to `/new/results` and select a "Shape N" card in the sidebar. Confirm the selected card now shows a neutral lightened background with a subtle neutral border, not a green wash/border. Check console for errors.

- [x] **Step 3: Commit**

```bash
git add src/components/fp-ui/card.tsx
git commit -m "FPCard: drop default border, selected state uses neutral surface

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: FPStepNav — drop number prefixes, neutral active state

**Files:**
- Modify: `src/components/fp-ui/step-nav.tsx`

**Interfaces:**
- Consumes: `.fp-text`, `--surface-selected` from Task 1.
- Produces: `FPStep`'s `number` field becomes unused for display (kept in the type for now since removing it would touch every call site's data — see note below) but is no longer rendered. `label`/`status`/`suffix`/`onClick`/`disabled` are unchanged.

- [x] **Step 1: Update FPStepNav**

Replace the full contents of `src/components/fp-ui/step-nav.tsx`:

```tsx
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * StepNav — plain-text step tabs ("Courses / Preferences"). No number
 * prefix (that was decoration reinforcing a retired terminal motif) and no
 * accent-colored active state — "you are here" is a neutral surface, not
 * a green one.
 */
export interface FPStep {
  number: string;
  label: string;
  status?: "upcoming" | "active" | "done";
  suffix?: React.ReactNode;
  onClick?: () => void;
  /** True when this step can't be reached yet (e.g. no results to show). Renders
   * visually inert — dimmed, no hover feedback, `cursor-not-allowed` — instead of
   * looking identical to a clickable step that silently does nothing when pressed. */
  disabled?: boolean;
}

export interface FPStepNavProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: FPStep[];
}

export function FPStepNav({ steps, className, ...props }: FPStepNavProps) {
  return (
    <div className={cn("flex bg-fp-bg-inset border-b border-fp-border-default", className)} {...props}>
      {steps.map((step, index) => {
        const isActive = step.status === "active";
        const isDone = step.status === "done";
        const isClickable = Boolean(step.onClick) && !step.disabled;
        const Wrapper = isClickable ? "button" : "div";
        return (
          <Wrapper
            key={step.label}
            type={isClickable ? "button" : undefined}
            disabled={Wrapper === "button" ? step.disabled : undefined}
            onClick={isClickable ? step.onClick : undefined}
            className={cn(
              "fp-text flex flex-1 items-center gap-2 px-5 py-3 text-[length:var(--text-small)] text-left transition-colors",
              index < steps.length - 1 && "border-r border-fp-border-default",
              isActive
                ? "text-fp-text-strong font-medium"
                : step.disabled
                  ? "cursor-not-allowed text-fp-text-dim opacity-40"
                  : isClickable
                    ? "cursor-pointer text-fp-text-dim hover:text-fp-text-body"
                    : "text-fp-text-dim"
            )}
            style={isActive ? { backgroundColor: "var(--surface-selected)" } : undefined}
          >
            {isDone ? <Check className="h-3.5 w-3.5 text-fp-accent" strokeWidth={1.5} /> : null}
            <span>{step.label}</span>
            {step.suffix}
          </Wrapper>
        );
      })}
    </div>
  );
}
```

What changed: the `step.number` field is no longer rendered at all (the `<span>{step.number}</span>`/`{isDone ? <Check/> : step.number}` block is gone — a done step now only shows a leading check icon, no digit ever renders). The active state's `border-b-2 border-b-fp-accent` + `accent-wash` background is replaced with `--surface-selected` and bold `text-strong`. The `number` field stays in the `FPStep` type/interface so `src/app/new/planner/page.tsx`'s existing `steps={[{number: "01", ...}, ...]}` array literal keeps compiling without edits — it's just inert data now. Do not remove the field from the type or the call site in this task; that's a structural/IA cleanup out of scope for this plan.

- [x] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean (the `number` prop is still accepted by the type, so the existing call site in `src/app/new/planner/page.tsx` needs no changes).

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner`. Confirm the step nav shows "Courses" / "Preferences" with no leading "01"/"02", and the active step has a neutral highlighted background (not a green underline). Check console for errors.

- [x] **Step 3: Commit**

```bash
git add src/components/fp-ui/step-nav.tsx
git commit -m "FPStepNav: drop number prefixes, neutral active state

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: FPShell — nav typography/active-state, campus/theme controls

**Files:**
- Modify: `src/components/fp-ui/fp-shell.tsx`

**Interfaces:**
- Consumes: `.fp-text`, `--surface-selected` from Task 1.
- Produces: no prop/signature changes — `FPShell` and `FPCampusGate` keep their existing external interface.

- [x] **Step 1: Replace the nav's accent pill with a neutral surface-selected treatment**

In `src/components/fp-ui/fp-shell.tsx`, find the nav rendering block (inside the `<nav className="fp-label hidden items-center...">` element). Change the outer `<nav>` className from:

```tsx
        <nav className="fp-label hidden items-center gap-[6px] text-[length:var(--text-micro)] lg:flex">
```

to:

```tsx
        <nav className="fp-text hidden items-center gap-[6px] text-[length:var(--text-small)] lg:flex">
```

Then replace the per-item `<Link>` block:

```tsx
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1.5 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                  active ? "text-fp-accent" : "text-fp-text-dim hover:text-fp-text-body"
                )}
              >
                {active ? (
                  <motion.div
                    layoutId="fp-nav-pill"
                    className="absolute inset-0 rounded-[var(--radius-pill)] border border-fp-border-accent"
                    style={{ backgroundColor: "var(--accent-wash)", zIndex: -1 }}
                    transition={navPillSpring}
                  />
                ) : null}
                <motion.span className="inline-flex" whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </motion.span>
                {item.label}
              </Link>
```

with:

```tsx
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                  active ? "text-fp-text-strong font-medium" : "text-fp-text-dim hover:text-fp-text-body"
                )}
              >
                {active ? (
                  <motion.div
                    layoutId="fp-nav-selected"
                    className="absolute inset-0 rounded-[var(--radius-md)]"
                    style={{ backgroundColor: "var(--surface-selected)", zIndex: -1 }}
                    transition={navPillSpring}
                  />
                ) : null}
                <motion.span className="inline-flex" whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </motion.span>
                {item.label}
              </Link>
```

(The sliding-motion mechanic from the earlier nav-pill work is kept — `layoutId` still animates the highlight between items — only its shape (pill → rounded-md rectangle, matching the "no pill for navigation" rule) and color (accent wash+border → neutral `--surface-selected`, no border) change. Renamed `layoutId` from `"fp-nav-pill"` to `"fp-nav-selected"` since it's no longer a pill — this is safe, `layoutId` only needs to be consistent within itself, not match any prior value.)

- [x] **Step 2: Campus dropdown trigger and menu — typography only, border stays (real affordance exception)**

Find:

```tsx
                className="fp-label inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-fp-border-default px-2.5 py-1.5 text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-text-body"
```

Change `fp-label` to `fp-text` and `text-[length:var(--text-micro)]` to `text-[length:var(--text-small)]`:

```tsx
                className="fp-text inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-fp-border-default px-2.5 py-1.5 text-[length:var(--text-small)] text-fp-text-dim hover:text-fp-text-body"
```

(The border stays here deliberately — this is a compound dropdown-trigger control, one of the spec's named exceptions: "interactive controls still need affordance... use a low-contrast neutral border." `border-fp-border-default` is already neutral, not accent — no color change needed, only typography.)

Inside the dropdown menu, find the per-option button's className:

```tsx
                          className={cn(
                            "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[length:var(--text-small)]",
                            option.active
                              ? "text-fp-text-body hover:bg-fp-bg-raised"
                              : "cursor-not-allowed text-fp-text-dim opacity-50"
                          )}
```

This one has no `fp-label` reference and no accent border — leave it unchanged.

- [x] **Step 3: Theme toggle button — no change needed**

The theme toggle already uses `<FPButton variant="secondary" size="sm">` with only an icon child (no text label), so Task 4's `FPButton` change already applies here automatically. No edit needed in this file for it.

- [x] **Step 4: FPCampusGate — campus card typography and "Ready" label**

Find:

```tsx
              <div className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">
                {CAMPUS_LABELS[option.campus]}
              </div>
              <FPLabel tone={option.active ? "accent" : "dim"} className="mt-3.5 inline-flex items-center gap-1">
```

Leave the heading `<div>` as-is (it already uses `font-fp-display`, the display font, which is correct — display headings were never part of the mono/uppercase complaint). The `FPLabel` call below it is a short inline status word ("Ready" / "Not yet"), not a section kicker — it correctly stays at the new `FPLabel` default (plain `.fp-text`, no `variant="eyebrow"` needed) after Task 2's change. No edit needed here beyond what Task 2 already did.

- [x] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new` and confirm: the primary nav's active item ("Home") shows a neutral rounded-rectangle highlight (not a green pill/border), nav label text is plain sans-serif not mono/uppercase, the campus dropdown trigger still has its neutral border and now reads in plain sans-serif. Click between nav items and confirm the highlight still slides smoothly (the `layoutId` animation still works). Toggle the campus dropdown open and confirm it still opens/closes correctly. Check console for errors.

- [x] **Step 6: Commit**

```bash
git add src/components/fp-ui/fp-shell.tsx
git commit -m "FPShell: neutral nav active-state, plain-text controls

Nav highlight keeps its sliding motion but changes shape (pill ->
rounded rectangle) and color (accent -> neutral surface-selected).
Campus/theme control typography moves to fp-text; the campus
dropdown trigger keeps its neutral border as a real affordance need.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: FPCoursesPane — tab buttons (typography, neutral active, drop icons), invisible-at-rest divider

**Files:**
- Modify: `src/features/planner/fp/FPCoursesPane.tsx`

**Interfaces:**
- Consumes: `.fp-text`, `--surface-selected` from Task 1.
- Produces: no prop/signature changes.

- [x] **Step 1: Tab buttons — plain text, no icon, neutral active state**

Find the tab-button rendering block:

```tsx
          <div className="mt-5 flex flex-wrap gap-2">
            {PLANNER_TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "fp-label inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-[7px] text-[length:var(--text-micro)] transition-colors",
                    active ? "border-fp-border-accent text-fp-accent" : "border-fp-border-default text-fp-text-dim hover:text-fp-text-body"
                  )}
                  style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
```

Replace with:

```tsx
          <div className="mt-5 flex flex-wrap gap-2">
            {PLANNER_TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "fp-text rounded-[var(--radius-sm)] px-3 py-[7px] text-[length:var(--text-small)] transition-colors",
                    active ? "text-fp-text-strong font-medium" : "text-fp-text-dim hover:text-fp-text-body"
                  )}
                  style={active ? { backgroundColor: "var(--surface-selected)" } : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
```

(`const Icon = item.icon;` and the `<Icon>` element are removed — per the spec, Search Catalog/Paste Text/Import File/Manual Entry drop their icons. If `Icon`/`item.icon` is otherwise unused after this edit and TypeScript or lint flags it, that's expected — `PLANNER_TABS`'s `icon` field itself lives in `src/features/planner/constants.ts` and stays defined there for potential reuse elsewhere; this task only stops rendering it here.)

- [x] **Step 2: Divider — invisible at rest**

Find:

```tsx
        <div
          className={cn(
            "h-full w-px transition-colors",
            isDragging ? "bg-fp-accent" : "bg-fp-border-default group-hover:bg-fp-accent"
          )}
        />
```

Replace with:

```tsx
        <div
          className={cn(
            "h-full w-px transition-colors",
            isDragging ? "bg-[var(--border-selected)]" : "bg-transparent group-hover:bg-fp-border-strong"
          )}
        />
```

(At rest: fully transparent — the divider is whitespace only. On hover: a neutral `border-strong`-toned line appears, giving discoverability. While actively dragging: the neutral `--border-selected` token, still no green — dragging is an interaction state, not an action/confirmation.)

- [x] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner` (Courses tab, campus selected). Confirm: the Search Catalog/Paste Text/Import File/Manual Entry buttons show text only, no icons; the active tab has a neutral highlighted background, not a green border/wash. Confirm the vertical divider between the course rail and the timetable preview is invisible when not hovered, and shows a subtle neutral line on hover (use `mcp__Claude_Browser__computer` with a `hover` action at the divider's coordinates, or inspect via `read_page`/`javascript_tool` computed style before and during a simulated `pointerenter`). Check console for errors.

- [x] **Step 4: Commit**

```bash
git add src/features/planner/fp/FPCoursesPane.tsx
git commit -m "FPCoursesPane: text-only tab buttons, neutral active state, invisible-at-rest divider

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Remove decorative icons from Delete/Delete-all buttons

**Files:**
- Modify: `src/features/planner/fp/FPCourseList.tsx`
- Modify: `src/app/new/saved/SavedWeekCard.tsx`

**Interfaces:** none (presentation-only).

- [x] **Step 1: Find every Delete/Delete-all button with a leading icon**

Run: `grep -n "Trash2" src/features/planner/fp/FPCourseList.tsx src/app/new/saved/SavedWeekCard.tsx`

For each match inside a `<FPButton>` or `<button>` whose visible text is "Delete" or "Delete all", remove the `<Trash2 .../>` element (and its now-unused import if `Trash2` isn't used elsewhere in that same file — re-run the grep after editing to confirm no remaining reference before removing the import line). Do **not** remove `Trash2`/`X`/similar icons used as **icon-only** controls with no adjacent text (e.g. a bare `×` delete button on a professor-option row or a blocked-window chip) — those are the spec's named exception and stay as-is.

Example — in `src/features/planner/fp/FPCourseList.tsx`, find:

```tsx
        <FPButton variant="ghost" size="sm" onClick={() => setIsDeleteAllOpen(true)} disabled={courses.length === 0}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete all
        </FPButton>
```

Change to:

```tsx
        <FPButton variant="ghost" size="sm" onClick={() => setIsDeleteAllOpen(true)} disabled={courses.length === 0}>
          Delete all
        </FPButton>
```

And further down in the same file, the confirm-dialog's destructive button:

```tsx
              <FPButton
                variant="primary"
                size="md"
                className="!bg-fp-danger hover:!bg-fp-danger"
                onClick={confirmDeleteAllCourses}
              >
                Delete all
              </FPButton>
```

already has no icon — leave unchanged.

- [x] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean (confirms no orphaned `Trash2` import broke anything and no unused-but-still-imported identifier causes a build error — this repo's `tsconfig.json` doesn't enable `noUnusedLocals`, so a leftover unused import won't fail this check, but remove it anyway for cleanliness per Step 1's instruction).

Using the Claude Browser pane, navigate to `http://localhost:3000/new/planner` with at least one course added, and to `http://localhost:3000/new/saved` with at least one saved schedule. Confirm "Delete all" and "Delete" render as text-only buttons. Check console for errors.

- [x] **Step 3: Commit**

```bash
git add src/features/planner/fp/FPCourseList.tsx src/app/new/saved/SavedWeekCard.tsx
git commit -m "Remove decorative icons from Delete/Delete-all buttons

Text alone is sufficient at this size/context; icon-only compact
controls (professor-row actions, chip removal) are unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Inputs and empty-state boxes — drop decorative borders

**Files:**
- Modify: `src/features/planner/fp/FPPrefControls.tsx`
- Modify: `src/features/planner/fp/FPSearchTab.tsx`
- Modify: `src/features/planner/fp/FPCourseList.tsx`
- Modify: `src/features/planner/fp/FPWeekSoFarPreview.tsx`
- Modify: `src/app/new/results/ZeroResultsFP.tsx`

**Interfaces:** none (presentation-only).

- [x] **Step 1: Input border — shared `fpInputClass`**

In `src/features/planner/fp/FPPrefControls.tsx`, find:

```tsx
export const fpInputClass =
  "w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-[7px] text-[13px] font-fp-mono text-fp-text-body outline-none transition-colors focus:border-fp-accent disabled:opacity-50";
```

Replace with:

```tsx
export const fpInputClass =
  "w-full rounded-[var(--radius-sm)] border border-transparent bg-fp-bg-inset px-2.5 py-[7px] text-[13px] fp-text text-fp-text-body outline-none transition-colors focus:border-fp-border-strong disabled:opacity-50";
```

(The `font-fp-mono` in the original was inconsistent with the spec — a time-input field showing e.g. `09:00` is arguably a compact data value, but per the spec's own list of what stays mono ("slot codes, course codes, compact numeric/time-token displays... only if you want the slot/time treatment to feel like a compact timetable token") this specific field is a plain HTML `<input type="time">` control for setting a preference, not a rendered timetable token — it moves to `.fp-text` like other interface text. The border goes fully transparent at rest (relying on the `bg-fp-bg-inset` surface step for definition) and appears only on focus, using the neutral `--border-strong` token, never accent.)

- [x] **Step 2: Search bar border**

In `src/features/planner/fp/FPSearchTab.tsx`, find the search input's wrapper:

```tsx
        <div className="flex flex-1 items-center gap-2.5 rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-inset px-[14px] py-[11px]">
```

Replace with:

```tsx
        <div className="flex flex-1 items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent bg-fp-bg-inset px-[14px] py-[11px] focus-within:border-fp-border-strong">
```

(`focus-within` applies the border when the inner `<input>` has focus, matching the "border only on focus" rule.)

- [x] **Step 3: Manual-entry form field borders**

In `src/features/planner/fp/FPCourseList.tsx`, find each of the manual-entry `<input>` elements sharing this className pattern (there are three — course code, course name, credits — plus the same pattern reused in the course-edit row further down):

```tsx
              className="rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-inset px-3 py-2 font-fp-mono text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
```

Replace `border border-fp-border-strong` with `border border-transparent`, and `focus:border-fp-border-accent` with `focus:border-fp-border-strong` in every occurrence of this pattern in the file (there are several near-identical field className strings — apply the same two substitutions to each). Leave `font-fp-mono` on the course-code field specifically (course codes are exactly the kind of value the spec keeps mono for); for the course-name and credits fields, change `font-fp-mono` to `fp-text` since a free-text name and a plain integer aren't FFCS tokens.

- [x] **Step 4: Empty-state boxes**

In `src/features/planner/fp/FPCourseList.tsx`, find:

```tsx
        <div className="rounded-[var(--radius-lg)] border border-dashed border-fp-border-default bg-fp-bg-inset p-8 text-center text-[13px] text-fp-text-dim">
          No courses added yet.
        </div>
```

Replace with:

```tsx
        <div className="p-8 text-center text-[13px] text-fp-text-dim">
          No courses added yet.
        </div>
```

In `src/features/planner/fp/FPSearchTab.tsx`, find the two similar dashed-border empty/loading messages ("Type at least 2 characters to search." and "No courses found for..."):

```tsx
        <div className="rounded-[var(--radius-lg)] border border-dashed border-fp-border-default bg-fp-bg-inset p-8 text-center text-[13px] text-fp-text-dim">
          Type at least 2 characters to search.
        </div>
```

and

```tsx
        <div className="rounded-[var(--radius-lg)] border border-dashed border-fp-border-default bg-fp-bg-inset p-8 text-center text-[13px] text-fp-text-dim">
          No courses found for &quot;{query}&quot;. Try paste text, file import, or manual entry.
        </div>
```

Remove `rounded-[var(--radius-lg)] border border-dashed border-fp-border-default bg-fp-bg-inset` from both, leaving `p-8 text-center text-[13px] text-fp-text-dim`.

In `src/features/planner/fp/FPWeekSoFarPreview.tsx`, find the floating "Add a course to see a live preview here." message (rendered as an absolutely-positioned overlay on top of the empty skeleton grid):

```tsx
            <p className="rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-surface px-4 py-2.5 text-center text-[13px] text-fp-text-dim">
              Add a course to see a live preview here.
            </p>
```

This one is a deliberate exception: it sits on top of the grid behind it and needs a background to stay legible against the grid lines, so keep the `bg-fp-bg-surface` background but drop the border:

```tsx
            <p className="rounded-[var(--radius-md)] bg-fp-bg-surface px-4 py-2.5 text-center text-[13px] text-fp-text-dim">
              Add a course to see a live preview here.
            </p>
```

In `src/app/new/results/ZeroResultsFP.tsx`, find the outer empty-state container (a bordered card wrapping the "no schedules" message) and remove its `border` class the same way, keeping only background/padding/text classes. Search for `border-fp-border-default` or `border-dashed` in that file to locate it precisely, since the exact surrounding className may include additional layout classes not reproduced here — remove only the border-related class(es), leave spacing/background/text classes intact.

- [x] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Using the Claude Browser pane: navigate to `http://localhost:3000/new/planner`, confirm the search input and manual-entry fields have no visible border at rest, and a neutral (not green) border appears when you click into one (verify via `read_page`/`javascript_tool` computed `border-color` before/after a simulated focus, or visually via screenshot after clicking). Confirm the "No courses added yet." and "Type at least 2 characters to search." messages no longer sit in a dashed box. Navigate to `http://localhost:3000/new/results` with no generated schedules and confirm the zero-results message has no enclosing border. Check console for errors.

- [x] **Step 6: Commit**

```bash
git add src/features/planner/fp/FPPrefControls.tsx src/features/planner/fp/FPSearchTab.tsx src/features/planner/fp/FPCourseList.tsx src/features/planner/fp/FPWeekSoFarPreview.tsx src/app/new/results/ZeroResultsFP.tsx
git commit -m "Drop decorative borders from inputs and empty-state boxes

Inputs go border-transparent at rest, neutral border only on focus.
Empty-state messages sit directly on the surrounding surface instead
of inside a bordered/dashed box.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: System-wide sweep — remaining `.fp-label` usage and accent-on-selection patterns

**Files:**
- Modify: any remaining file under `src/app/new/**`, `src/components/fp-ui/**`, `src/features/planner/fp/**` matched by the greps below.

**Interfaces:** none (presentation-only).

This task exists because Tasks 1–10 covered the highest-traffic shared primitives and the most-cited call sites, but the spec's own "Files touched" section is explicit that "the principles in this spec apply system-wide, not only to the files named [individually]." This task is the sweep that makes that true.

- [x] **Step 1: Find every remaining `.fp-label` usage**

Run: `grep -rln "fp-label" src/app/new src/components/fp-ui src/features/planner/fp`

For every file in the result **except** `src/components/fp-ui/label.tsx` (which is expected to still contain `fp-label`... actually it should not — re-check: after Task 2, `label.tsx` no longer references the literal string `"fp-label"` at all, since it now emits `"fp-eyebrow"` or `"fp-text"`. So after Tasks 1–10, **zero** files should match this grep. Any match is a leftover that must be fixed now.)

For each remaining match: open the file, find the `className` containing `fp-label`, and replace it with `fp-text` (or, if the specific instance is a genuine section-kicker sitting directly above a heading, use the `FPLabel`-with-`variant="eyebrow"` pattern from Task 2 instead of a bare `.fp-eyebrow` class, so the color/tone logic stays centralized in the component rather than duplicated ad hoc). Re-run the grep after each fix.

- [x] **Step 2: Find remaining accent-wash-on-selection patterns**

Run: `grep -rn 'backgroundColor: "var(--accent-wash)"' src/app/new src/components/fp-ui src/features/planner/fp`

For each match, read the surrounding code to determine whether it represents a **selection/active state** (fix: change to `"var(--surface-selected)"` and drop any adjacent `border-fp-border-accent` in the same conditional) or a **genuinely meaningful confirmation/action state** (leave unchanged — e.g. a checked `FPToggleRow`-style control representing an affirmative choice, or a form section that's actively highlighted because the user is performing the primary action in it). When in doubt, apply the spec's test: does this represent "you are here / this is selected," or "this is an action / confirmation"? The former changes, the latter doesn't.

Known remaining call sites to check explicitly (their status may have already been superseded by earlier tasks — verify with the grep, don't assume):
- `src/app/new/page.tsx` (Landing) — the selected/current campus card, if it uses this pattern independently of `FPCard`.
- `src/features/planner/fp/FPSearchTab.tsx` and `FPCourseList.tsx` — the theory/lab slot-picker chip "active" states (`TheoryPicker`/`LabPicker` in `FPCourseList.tsx`, and the option-row `selected` state in `FPSearchTab.tsx`'s `optionRow`) — these represent the user actively choosing a specific slot/professor option, which is closer to "affirmative selection of a concrete value" than passive navigation. Treat these the same as the checkbox exception: **leave them accent-colored**, since ticking/choosing a specific slot or professor is an affirmative action, not a "current location" signal — this mirrors the spec's explicit checkbox reasoning.
- `src/features/planner/fp/FPPreferencesPane.tsx` — none expected after the earlier Preferences simplification (single-page, no more tabbed sections), but verify with the grep.

- [x] **Step 3: Fix links that default to accent color**

Run: `grep -rn "text-fp-accent\|text-fp-text-accent" src/app/new src/components/fp-ui src/features/planner/fp`

Per the spec's Links row, a plain reference link should be neutral by default and only turn accent on hover (or stay accent only if it's genuinely acting as a CTA, like "Create share link" in `src/app/new/saved/page.tsx`, which the spec explicitly allows to stay accent). Check each match: if it's a `<Link>`/`<a>`/clickable `<span>` whose accent color applies unconditionally (not inside a `hover:` class, not gated on a `selected`/`active` state already handled in Step 2), it's a link defaulting to accent and must change.

Known fix — in `src/app/new/page.tsx` (Landing), find:

```tsx
          Never done FFCS before? <span className="cursor-pointer text-fp-text-accent underline underline-offset-[3px]">40-second explainer</span>
```

Change to:

```tsx
          Never done FFCS before? <span className="cursor-pointer text-fp-text-body underline underline-offset-[3px] hover:text-fp-accent">40-second explainer</span>
```

(Neutral `text-fp-text-body` by default, accent only on hover — this is a plain informational link, not a CTA, so it gets the "green on hover" treatment rather than staying accent unconditionally.)

Apply the same neutral-default/accent-on-hover pattern to any other plain reference link the grep surfaces that isn't already covered by Step 2's selection-state logic or explicitly named as a CTA exception.

- [x] **Step 4: Find remaining accent-border-on-selection patterns not yet caught**

Run: `grep -rn "border-fp-border-accent" src/app/new src/components/fp-ui src/features/planner/fp`

Apply the same test as Step 2 to each match. Convert selection/navigation uses to `border-[var(--border-selected)]`; leave affirmative-action/meaningful-status uses (recommended/best-overall card borders if any exist independently of `FPCard`, the slot-picker chips) unchanged.

- [x] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `grep -rln "fp-label" src/app/new src/components/fp-ui src/features/planner/fp`
Expected: **no output anywhere, including `label.tsx`.** This is stricter than the spec's own wording, which allowed the string to survive "inside `label.tsx` itself, on the compatibility path." This plan's `label.tsx` (Task 2) never emits the literal string `fp-label` at all — it emits `fp-eyebrow`/`fp-text` instead — so the correct outcome here is zero matches everywhere, not one-file-exempted. That's a strict superset of what the spec required, not a deviation from it.

Using the Claude Browser pane, do a full page-by-page pass in dark theme: `/new`, `/new/planner` (Courses + Preferences), `/new/results` (with a generated schedule), `/new/compare`, `/new/saved` (with a saved schedule), `/new/settings`. Screenshot each. Confirm: no stray mono/uppercase/tracked text remains anywhere, the only green surfaces are primary CTAs, checked checkboxes, slot/professor-option selection chips, and "Best overall"/"Recommended" badges. Confirm the Landing page's "40-second explainer" link is neutral by default and only turns accent on hover. Toggle to light theme (`Toggle theme` button) and repeat the same pass — confirm the neutral selection tokens render sensibly in light mode too (not washed out, not indistinguishable from the page background). Check console for errors on every page (`onlyErrors: true`).

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "Sweep remaining fp-label, accent-on-selection, and default-accent links

Confirms fp-label no longer appears anywhere in /new source. Neutral-
izes remaining selection-state accent wash/border, and moves plain
reference links (e.g. the Landing page's 40-second explainer) to
neutral-by-default/accent-on-hover. Slot/professor-option selection
chips and the checkbox stay accent per the spec's affirmative-action
exception.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Retire `.fp-label`'s CSS definition

**STATUS: SKIPPED.** This task's own precondition (Step 1's grep returning zero matches) is permanently false: `schedule-grid.tsx` and `slot-matrix-timetable.tsx` are deliberately exempt from this entire plan (see Global Constraints) and still legitimately reference `.fp-label` for their slot-code/header cells, which the spec says should stay monospace anyway. The `.fp-label` CSS rule in `fp-tokens.css` remains load-bearing for those two files and must NOT be removed until (if ever) that separate structural track migrates them off it. Do not "complete" this task by deleting the rule — doing so will silently break the timetable's slot-label styling.

**Files:**
- Modify: `src/app/new/fp-tokens.css`

**Interfaces:** none — this is the final cleanup once Task 11 has confirmed nothing references the class anymore.

- [ ] **Step 1: Confirm zero remaining references**

Run: `grep -rln "fp-label" src/app/new src/components/fp-ui src/features/planner/fp`
Expected: no output. If this produces any match, **stop and go back to Task 11** — do not proceed with this task until the sweep is genuinely complete, since removing the CSS class definition while something still references it will silently break that element's styling (it'll fall back to unstyled default text, not error visibly).

- [ ] **Step 2: Remove the `.fp-label` CSS rule**

In `src/app/new/fp-tokens.css`, remove the block:

```css
/* the system's signature: mono, uppercase, generously tracked micro-labels —
   used on nearly every panel header, step, metric and button */
.fp-label {
  font-family: var(--font-mono);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
}
```

entirely (this comment block plus its rule — by this point it's dead CSS, since Task 11's grep confirmed nothing in the `/new` source references the class).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean (CSS-only removal, but confirms nothing else broke).

Using the Claude Browser pane, do one final full pass across the same pages as Task 11's Step 5 verification and confirm nothing changed visually from that pass (since nothing should have referenced the removed class — this step is a safety net, not expected to change anything visible).

- [ ] **Step 4: Commit**

```bash
git add src/app/new/fp-tokens.css
git commit -m "Retire the .fp-label CSS rule

Confirmed via grep that nothing in /new source references it anymore
(Task 11's sweep). Typography now runs entirely through fp-text/
fp-eyebrow/fp-code.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

**Spec coverage check:**
- Typography (3-tier system, FPLabel, FPStepNav number removal) — Tasks 1, 2, 6.
- Color (surface-selected/border-selected tokens, nav/step-nav/card/tab-button re-mapping, badge tone re-triage, checkbox/slot-picker exceptions preserved, links neutral-by-default) — Tasks 1, 3, 5, 6, 7, 8, 11.
- Borders (buttons, inputs, cards, badges, empty states, divider, timetable exemption) — Tasks 4, 5, 8, 10; timetable/slot-table structural borders are explicitly never touched by any task (Global Constraints).
- Icons (nav kept, tab buttons + delete removed, compact icon-only controls kept) — Tasks 8, 9.
- No-new-token invariant — enforced by Global Constraints and the fact that only Task 1 introduces tokens.
- Stricter `.fp-label` grep invariant from the spec review round — Task 11 Step 5, enforced again in Task 12 Step 1 (this plan achieves zero matches everywhere, a strict superset of the spec's "except inside label.tsx" allowance — see the note in Task 11 Step 5).
- Links spec row (neutral by default, accent on hover or for a genuine CTA) — caught in self-review as a gap in the first draft of this plan and added as Task 11 Step 3.

**Type consistency check:** `FPLabelProps.variant`, `FPBadgeProps.mono`, and `FPStep.number` (kept but unrendered) are each defined once (Tasks 2, 3, 6 respectively) and every later task that touches a consumer of these components uses the same names — no renames introduced across tasks.

**No-placeholder scan:** every step above shows the literal before/after code or the exact grep command to run; no step says "add appropriate styling" or "similar to Task N" without reproducing the code.
