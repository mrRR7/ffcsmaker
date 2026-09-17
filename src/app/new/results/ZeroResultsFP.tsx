"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { FPButton } from "@/components/fp-ui/button";
import { FPCard } from "@/components/fp-ui/card";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { useAppStore, defaultConstraints } from "@/store/useAppStore";
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

  const courseNotes = useMemo(() => {
    const byCourse = new Map<string, { tone: "warn" | "default"; lines: string[] }>();
    findings.forEach((finding) => {
      for (const code of [finding.courseCodeA, finding.courseCodeB]) {
        if (!code) continue;
        const entry = byCourse.get(code) ?? { tone: "warn" as const, lines: [] };
        entry.lines.push(finding.description);
        byCourse.set(code, entry);
      }
    });
    return Array.from(byCourse.entries());
  }, [findings]);

  function relaxAndRegenerate() {
    resetConstraints();
    generate({
      courses,
      slots,
      constraints: defaultConstraints,
      rankingMode,
      usePriorityRanking,
      maxResults: 500
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-fp-display text-[28px] font-bold text-fp-text-strong sm:text-[var(--text-display)]">
            {findings.length > 0
              ? "No week survives all of your rules."
              : "No week survives this combination of courses and rules."}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--text-body-size)] leading-[1.5] text-fp-text-body">
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
                <div className="font-fp-mono text-[var(--text-h)] text-fp-text-strong sm:text-[22px]">
                  {topFinding.constraintLabel ??
                    [topFinding.courseCodeA, topFinding.courseCodeB].filter(Boolean).join(" + ")}
                </div>
                <p className="mt-2 text-[14px] leading-[1.5] text-fp-text-body">
                  {topFinding.description} {suggestionFor(topFinding)}.
                </p>
              </div>
              <FPButton
                variant="primary"
                onClick={relaxAndRegenerate}
                disabled={isGenerating}
                className="shrink-0"
              >
                <RefreshCw className={isGenerating ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                {isGenerating ? `Regenerating · ${Math.round(progress)}%` : "Relax all rules · regenerate"}
              </FPButton>
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

        {findings.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default">
            <div className="fp-label grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-fp-border-default bg-fp-bg-inset px-4 py-[11px] text-[var(--text-micro)] text-fp-text-dim">
              <span>Rule</span>
              <span>What it costs you</span>
              <span className="text-right">Action</span>
            </div>
            {findings.map((finding, index) => {
              const isWorst = index === 0;
              const isConstraint = finding.type === "constraint_eliminates_course";
              return (
                <div
                  key={`${finding.type}-${finding.courseCodeA}-${finding.courseCodeB ?? index}`}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-fp-border-default px-4 py-[13px] text-[var(--text-small)] last:border-b-0"
                  style={isWorst ? { backgroundColor: "var(--warn-wash)" } : undefined}
                >
                  <span className={isWorst ? "text-fp-warn" : index > 2 ? "text-fp-text-dim" : "text-fp-text-body"}>
                    {finding.description}
                  </span>
                  <span className={isWorst ? "text-fp-warn" : "text-fp-text-dim"}>
                    {suggestionFor(finding)}
                  </span>
                  <button
                    type="button"
                    onClick={isConstraint ? relaxAndRegenerate : () => router.push("/new/planner")}
                    disabled={isConstraint && isGenerating}
                    className={
                      "fp-label text-right text-[var(--text-micro)] " +
                      (isWorst ? "text-fp-warn" : index > 2 ? "text-fp-text-dim" : "text-fp-accent")
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
        <div className="fp-label border-b border-fp-border-default px-4 py-[14px] text-[var(--text-micro)] text-fp-text-dim">
          Courses under strain
        </div>
        <div className="divide-y divide-fp-border-default">
          {courseNotes.length > 0 ? (
            courseNotes.map(([code, entry]) => (
              <FPNote key={code} tone="warn" className="m-4">
                <span className="font-fp-mono text-[var(--text-small)] text-fp-text-strong">{code}</span>
                <br />
                {entry.lines[0]}
              </FPNote>
            ))
          ) : (
            <p className="p-4 text-[var(--text-small)] text-fp-text-dim">No single course stands out — see the rule list.</p>
          )}
        </div>
        <div className="border-t border-fp-border-default p-4">
          <FPLabel>If you change nothing</FPLabel>
          <p className="mt-2 text-[var(--text-small)] leading-[1.5] text-fp-text-dim">
            Registration works without us — but you&apos;d be cross-checking{" "}
            {totalRawCombinations.toLocaleString()} raw combinations by hand.
          </p>
          <FPButton
            variant="secondary"
            className="mt-4 w-full justify-center"
            onClick={() => router.push("/new/planner")}
          >
            Back to preferences
          </FPButton>
          <FPButton
            variant="ghost"
            className="mt-2 w-full justify-center"
            onClick={() => resetConstraints()}
          >
            Clear all rules
          </FPButton>
        </div>
      </aside>
    </div>
  );
}
