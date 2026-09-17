"use client";

import { useAppStore } from "@/store/useAppStore";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { FPFieldGroup, fpInputClass } from "./FPPrefControls";
import { FPBlockedWindowsPanel } from "./FPBlockedWindowsPanel";

/**
 * FPPreferencesPane — "02 Preferences" tab of /new/planner.
 *
 * Deliberately just two things: the two hard time bounds that actually
 * matter (start-after / end-before, both global), and Blocked Windows.
 * Everything else that used to live here (workload caps, avoid-first/last
 * toggles, per-day overrides, the Early Finish flow) either did nothing
 * (dead code, confirmed unread by src/engine/*) or was redundant once a
 * global start/end exists. Ranking profile moved to the Courses page, next
 * to "Find my weeks" — see src/app/new/planner/page.tsx.
 */
export function FPPreferencesPane() {
  const constraints = useAppStore((state) => state.constraints);
  const setConstraint = useAppStore((state) => state.setConstraint);
  const resetConstraints = useAppStore((state) => state.resetConstraints);

  return (
    <div className="mx-auto max-w-2xl px-6 py-7">
      <h2 className="text-[22px]">Anything you&apos;d rather avoid?</h2>
      <p className="mb-6 mt-1.5 text-[length:var(--text-small)] text-fp-text-dim">
        All optional. Skip and we&apos;ll show you every week that works.
      </p>

      <section>
        <FPLabel tone="accent" className="block">
          When can classes happen?
        </FPLabel>
        <FPNote className="mt-2">
          Global hard bounds &mdash; schedules that violate these are rejected outright, not just penalized.
        </FPNote>
        <div className="mt-3 grid gap-3 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-4 sm:grid-cols-2">
          <FPFieldGroup label="start_after">
            <input
              type="time"
              className={fpInputClass}
              value={constraints.earliestStart ?? ""}
              onChange={(event) => setConstraint("earliestStart", event.target.value || null)}
            />
          </FPFieldGroup>
          <FPFieldGroup label="end_before">
            <input
              type="time"
              className={fpInputClass}
              value={constraints.latestEnd ?? ""}
              onChange={(event) => setConstraint("latestEnd", event.target.value || null)}
            />
          </FPFieldGroup>
        </div>
      </section>

      <section className="mt-8">
        <FPLabel tone="accent" className="block">
          Busy times
        </FPLabel>
        <p className="mt-2 text-[length:var(--text-small)] text-fp-text-dim">
          Classes, gym, club, commute &mdash; anything that should never get a class scheduled over it.
        </p>
        <div className="mt-3">
          <FPBlockedWindowsPanel />
        </div>
      </section>

      <div className="mt-8 flex justify-center border-t border-fp-border-default pt-6">
        <FPButton variant="secondary" size="md" onClick={resetConstraints}>
          Reset all constraints
        </FPButton>
      </div>
    </div>
  );
}
