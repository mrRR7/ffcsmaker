"use client";

import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { FPFieldGroup, fpInputClass } from "./FPPrefControls";
import { FPBlockedWindowsPanel } from "./FPBlockedWindowsPanel";

type Bounds = { earliestStart: string | null; latestEnd: string | null };

// One-tap versions of the most common asks, mapped onto the two time bounds.
// Times match the standard slot catalog: first period 08:00-08:50, morning
// labs end by 13:25, afternoon starts at 14:00.
const PRESETS: Array<{ label: string; apply: (current: Bounds) => Bounds }> = [
  { label: "No 8 AM classes", apply: (c) => ({ ...c, earliestStart: "08:55" }) },
  { label: "Done by 5 PM", apply: (c) => ({ ...c, latestEnd: "17:00" }) },
  { label: "Mornings only", apply: () => ({ earliestStart: null, latestEnd: "13:30" }) },
  { label: "Afternoons only", apply: () => ({ earliestStart: "14:00", latestEnd: null }) }
];

/**
 * FPPreferencesPane — "02 Preferences" tab of /planner.
 *
 * Deliberately just two things: the two hard time bounds that actually
 * matter (start-after / end-before, both global), and Blocked Windows.
 * Everything else that used to live here (workload caps, avoid-first/last
 * toggles, per-day overrides, the Early Finish flow) either did nothing
 * (dead code, confirmed unread by src/engine/*) or was redundant once a
 * global start/end exists. Ranking profile moved to the Courses page, next
 * to "Find my weeks" — see src/app/planner/page.tsx.
 *
 * Desktop: bounds, presets and actions on the left, the busy grid on the
 * right, so the page uses the width instead of one narrow centred column.
 */
export function FPPreferencesPane({ actions }: { actions?: React.ReactNode }) {
  const constraints = useAppStore((state) => state.constraints);
  const setConstraint = useAppStore((state) => state.setConstraint);
  const resetConstraints = useAppStore((state) => state.resetConstraints);

  const current: Bounds = { earliestStart: constraints.earliestStart, latestEnd: constraints.latestEnd };

  function setBounds(next: Bounds) {
    setConstraint("earliestStart", next.earliestStart);
    setConstraint("latestEnd", next.latestEnd);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-[22px]">Anything you&apos;d rather avoid?</h2>
        <p className="mt-1.5 text-[length:var(--text-small)] text-fp-text-dim">
          All optional. Skip and we&apos;ll show you every week that works.
        </p>

        <section className="mt-6">
          <FPLabel tone="accent" className="block">
            When can classes happen?
          </FPLabel>
          <FPNote className="mt-2">Weeks with any class outside these times are left out entirely.</FPNote>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const next = preset.apply(current);
              // Active when applying it would change nothing; tapping it again clears both bounds.
              const active =
                next.earliestStart === current.earliestStart &&
                next.latestEnd === current.latestEnd &&
                (current.earliestStart !== null || current.latestEnd !== null);
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBounds(active ? { earliestStart: null, latestEnd: null } : next)}
                  className={cn(
                    "fp-text rounded-[var(--radius-pill)] border px-3.5 py-2 text-[length:var(--text-small)] transition-colors",
                    active
                      ? "border-fp-border-accent text-fp-text-strong"
                      : "border-fp-border-default text-fp-text-body hover:border-fp-border-strong"
                  )}
                  style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-4 sm:grid-cols-2">
            <FPFieldGroup label="Classes start after">
              <input
                type="time"
                className={fpInputClass}
                value={constraints.earliestStart ?? ""}
                onChange={(event) => setConstraint("earliestStart", event.target.value || null)}
              />
            </FPFieldGroup>
            <FPFieldGroup label="Classes end by">
              <input
                type="time"
                className={fpInputClass}
                value={constraints.latestEnd ?? ""}
                onChange={(event) => setConstraint("latestEnd", event.target.value || null)}
              />
            </FPFieldGroup>
          </div>
        </section>

        {/* Phone has the sticky bottom bar for these. */}
        <div className="mt-8 hidden flex-col items-start gap-4 border-t border-fp-border-default pt-6 lg:flex">
          {actions}
          <FPButton variant="ghost" size="sm" onClick={resetConstraints}>
            Clear all preferences
          </FPButton>
        </div>
      </div>

      <section className="mt-8 lg:mt-0">
        <FPLabel tone="accent" className="block">
          Busy times
        </FPLabel>
        <p className="mt-2 text-[length:var(--text-small)] text-fp-text-dim">
          Classes, gym, club, commute &mdash; anything that should never get a class scheduled over it.
        </p>
        <div className="mt-3">
          <FPBlockedWindowsPanel />
        </div>
        <FPButton variant="ghost" size="sm" className="mt-6 lg:hidden" onClick={resetConstraints}>
          Clear all preferences
        </FPButton>
      </section>
    </div>
  );
}
