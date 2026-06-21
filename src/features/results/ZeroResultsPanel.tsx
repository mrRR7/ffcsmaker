"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function ZeroResultsPanel() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const resetConstraints = useAppStore((state) => state.resetConstraints);

  const { generate, isGenerating, progress } = useGenerator();

  const findings = useMemo(
    () => analyzeZeroResultCause(courses, slots, constraints),
    [courses, slots, constraints]
  );

  // Show first 3 by default, expand for the rest
  const VISIBLE_COUNT = 3;
  const visibleFindings = showAll ? findings : findings.slice(0, VISIBLE_COUNT);
  const hasMore = findings.length > VISIBLE_COUNT;

  function handleRelaxConstraints() {
    resetConstraints();

    // Auto-retrigger generation immediately — the student already expressed
    // intent by being on this screen, don't make them navigate back and
    // click Generate again.
    generate({
      courses,
      slots,
      constraints: defaultConstraints,
      rankingMode,
      usePriorityRanking,
      maxResults: 500,
    });
  }

  return (
    <div className="pb-20 lg:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-lg py-12 px-4"
      >
        {/* Icon + Heading */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
            <Zap className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-ink">
            No valid timetables found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Your current courses and constraints don&apos;t allow for any
            conflict-free combination.
          </p>
        </div>

        {/* Findings or fallback */}
        {findings.length > 0 ? (
          <div className="space-y-3 mb-8">
            <AnimatePresence initial={false}>
              {visibleFindings.map((finding, i) => (
                <motion.div
                  key={`${finding.type}-${finding.courseCodeA}-${finding.courseCodeB ?? i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                >
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-ink">
                            {finding.description}
                          </p>
                          <p className="text-xs text-primary mt-1.5">
                            → {suggestionFor(finding)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1 mx-auto text-xs text-muted-foreground hover:text-ink transition"
              >
                {showAll ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show {findings.length - VISIBLE_COUNT} more{" "}
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          /* Fallback: the analyzer found no specific single cause —
             this happens with complex multi-course interactions that
             the pairwise/single-course checks can't explain. */
          <Card className="border-hairline mb-8">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                This is likely caused by a combination of multiple courses and
                constraints together rather than a single conflict. Try removing
                one course or constraint at a time to narrow it down.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/planner")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Button>
          <Button
            onClick={handleRelaxConstraints}
            disabled={isGenerating}
          >
            <RotateCcw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating
              ? `Regenerating… ${Math.round(progress)}%`
              : "Relax all constraints"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
