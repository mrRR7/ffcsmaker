"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { FPButton } from "@/components/fp-ui/button";
import { FPCard } from "@/components/fp-ui/card";
import { FPLabel } from "@/components/fp-ui/label";
import { useAppStore, defaultConstraints } from "@/store/useAppStore";
import type { Constraints } from "@/engine/types";
import { useGenerator } from "@/hooks/useGenerator";
import { analyzeZeroResultCause, ConflictFinding } from "@/engine/conflictAnalyzer";

function suggestionFor(finding: ConflictFinding): string {
  switch (finding.type) {
    case "course_always_conflicts":
      return `Add another professor option for ${finding.courseCodeA} or ${finding.courseCodeB}`;
    case "constraint_eliminates_course":
      return `Loosen "${finding.constraintLabel}" or add more options for ${finding.courseCodeA}`;
    case "course_no_eligible_options":
      return `${finding.courseCodeA} has no available options — add professor options from the catalog`;
  }
}

/** The constraint fields behind an analyzer label (see
 * identifyEliminatingConstraint), so "Drop" can clear just that rule. */
function patchForLabel(label: string): Partial<Constraints> {
  if (label === "Professor lock") return { professorLocks: [] };
  if (label === "Avoided professor list") return { avoidProfessors: [] };
  if (label.startsWith("No classes after")) return { noAfterTime: null };
  if (label.startsWith("No classes before")) return { earliestStart: null };
  if (label.startsWith("Must end before")) return { latestEnd: null };
  if (label === "Avoid first period") return { avoidFirstPeriod: false };
  if (label === "Avoid last period") return { avoidLastPeriod: false };
  // ponytail: busy blocks are labelled by name, not id — dropping clears all
  // of them. Carry the window id on the finding if people keep several.
  return { blockedWindows: [] };
}

/**
 * "FFCS Planner" skin's zero-results page. Reuses ZeroResultsPanel's real
 * data sources (analyzeZeroResultCause, useGenerator, resetConstraints)
 * verbatim — only the presentation is new. The mockup's "relax this one
 * constraint, get 7 weeks back" callout implies a precomputed schedule
 * count per candidate relaxation; that number isn't knowable without
 * actually re-running the generator (a worker pass), so rather than
 * fabricate a figure we show the real diagnostic text and wire the same
 * "relax + regenerate" action the classic app already performs, with a
 * real toast reporting the actual resulting count once it lands.
 */
export function ZeroResultsFP() {
  const router = useRouter();
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore((state) => state.uiPreferences.usePriorityRanking);
  const resetConstraints = useAppStore((state) => state.resetConstraints);
  const setConstraint = useAppStore((state) => state.setConstraint);

  const { generate, isGenerating, progress } = useGenerator();

  const findings = useMemo(
    () => analyzeZeroResultCause(courses, slots, constraints),
    [courses, slots, constraints]
  );

  const totalRawCombinations = useMemo(
    () => courses.reduce((product, course) => product * Math.max(1, course.options.length), 1),
    [courses]
  );

  const topFinding = findings[0] ?? null;

  function regenerateWith(next: Constraints) {
    generate({ courses, slots, constraints: next, rankingMode, usePriorityRanking, maxResults: 500 });
  }

  function relaxAndRegenerate() {
    resetConstraints();
    regenerateWith(defaultConstraints);
  }

  function dropAndRegenerate(label: string) {
    const patch = patchForLabel(label);
    for (const [key, value] of Object.entries(patch)) {
      setConstraint(key as keyof Constraints, value as never);
    }
    regenerateWith({ ...constraints, ...patch });
  }

  const topIsConstraint = topFinding?.type === "constraint_eliminates_course" && !!topFinding.constraintLabel;

  return (
    <div className="grid grid-cols-1 gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-fp-display text-[28px] font-bold text-fp-text-strong sm:text-[length:var(--text-display)]">
            {topFinding?.type === "course_always_conflicts"
              ? "Two of your courses can't fit together."
              : findings.length > 0
                ? "No week survives all of your rules."
                : "No week survives this combination of courses and rules."}
          </h1>
          <p className="mt-3 max-w-2xl text-[length:var(--text-body-size)] leading-[1.5] text-fp-text-body">
            We checked every combination of professors and slots your courses allow. None of them
            clear your constraints without a clash.
          </p>
        </div>

        {topFinding ? (
          <div
            className="rounded-[var(--radius-lg)] border border-fp-border-accent p-6"
            style={{ backgroundColor: "var(--accent-wash)" }}
          >
            <FPLabel tone="accent">The one most likely to blame</FPLabel>
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="font-fp-mono text-[length:var(--text-h)] text-fp-text-strong sm:text-[22px]">
                  {topFinding.constraintLabel ??
                    [topFinding.courseCodeA, topFinding.courseCodeB].filter(Boolean).join(" + ")}
                </div>
                <p className="mt-2 text-[14px] leading-[1.5] text-fp-text-body">
                  {topFinding.description} {suggestionFor(topFinding)}.
                </p>
              </div>
              {topIsConstraint || topFinding.type !== "constraint_eliminates_course" ? (
                <FPButton
                  variant="primary"
                  onClick={() =>
                    topIsConstraint ? dropAndRegenerate(topFinding.constraintLabel!) : router.push("/planner")
                  }
                  disabled={isGenerating}
                  className="shrink-0"
                >
                  <RefreshCw className={isGenerating ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                  {isGenerating
                    ? `Regenerating · ${Math.round(progress)}%`
                    : topIsConstraint
                      ? `Drop "${topFinding.constraintLabel}" · regenerate`
                      : "Add professor options"}
                </FPButton>
              ) : null}
            </div>
          </div>
        ) : (
          <FPCard>
            <p className="text-[14px] leading-[1.5] text-fp-text-dim">
              This looks like several courses and rules interacting together rather than one single
              cause. Try removing one course or one rule at a time to narrow it down.
            </p>
          </FPCard>
        )}

        {/* The top finding is already the card above — list the rest only. */}
        {findings.length > 1 ? (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default">
            <div className="fp-text grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-fp-border-default bg-fp-bg-inset px-4 py-[11px] text-[length:var(--text-micro)] text-fp-text-dim">
              <span>Rule</span>
              <span>Fix</span>
              <span className="text-right">Action</span>
            </div>
            {findings.slice(1).map((finding, i) => {
              const index = i + 1;
              const isConstraint = finding.type === "constraint_eliminates_course";
              return (
                <div
                  key={`${finding.type}-${finding.courseCodeA}-${finding.courseCodeB ?? index}`}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-fp-border-default px-4 py-[13px] text-[length:var(--text-small)] last:border-b-0"
                >
                  <span className={index > 2 ? "text-fp-text-dim" : "text-fp-text-body"}>
                    {finding.description}
                  </span>
                  <span className="text-fp-text-dim">
                    {suggestionFor(finding)}
                  </span>
                  <button
                    type="button"
                    onClick={
                      isConstraint && finding.constraintLabel
                        ? () => dropAndRegenerate(finding.constraintLabel!)
                        : () => router.push("/planner")
                    }
                    disabled={isConstraint && isGenerating}
                    className={
                      // -m-2 p-2: ~32px hit area without shifting the text.
                      "fp-text -m-2 p-2 text-right text-[length:var(--text-micro)] " +
                      "text-fp-text-dim hover:text-fp-accent"
                    }
                  >
                    {isConstraint ? "Drop" : "Edit"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <aside className="h-fit rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface">
        <div className="p-4">
          <FPLabel>If you change nothing</FPLabel>
          <p className="mt-2 text-[length:var(--text-small)] leading-[1.5] text-fp-text-dim">
            Registration works without us — but you&apos;d be cross-checking{" "}
            {totalRawCombinations.toLocaleString()} raw combinations by hand.
          </p>
          <FPButton
            variant="secondary"
            className="mt-4 w-full justify-center"
            onClick={() => router.push("/planner")}
          >
            Back to preferences
          </FPButton>
          <FPButton
            variant="ghost"
            className="mt-2 w-full justify-center"
            onClick={relaxAndRegenerate}
            disabled={isGenerating}
          >
            Clear all rules · regenerate
          </FPButton>
        </div>
      </aside>
    </div>
  );
}
