"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { usePlannerGeneration } from "@/features/planner/usePlannerGeneration";
import { prewarmCatalogCache } from "@/lib/catalogCache";
import { FPStepNav } from "@/components/fp-ui/step-nav";
import { FPButton } from "@/components/fp-ui/button";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { FPCoursesPane } from "@/features/planner/fp/FPCoursesPane";
import { FPPreferencesPane } from "@/features/planner/fp/FPPreferencesPane";

type PlannerTab = "courses" | "preferences";

export default function NewPlannerPage() {
  const router = useRouter();
  const [tab, setTab] = useState<PlannerTab>("courses");
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed_preliminary_notice");
    if (!dismissed) setShowNotice(true);
  }, []);

  const courses = useAppStore((state) => state.courses);
  const constraints = useAppStore((state) => state.constraints);
  const campus = useAppStore((state) => state.campus);
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const rankingMode = useAppStore((state) => state.rankingMode);

  const { cancel, isGenerating, progress, checked, accepted, runGeneration } = usePlannerGeneration();

  const optionCount = useMemo(
    () => courses.reduce((sum, course) => sum + course.options.length, 0),
    [courses]
  );
  const activeConstraintCount = useMemo(() => Object.values(constraints).filter(Boolean).length, [constraints]);
  const slots = useAppStore((state) => state.slots);

  useEffect(() => {
    if (campus) void prewarmCatalogCache(campus);
  }, [campus]);

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <FPStepNav
        steps={[
          {
            number: "01",
            label: "Courses",
            status: tab === "courses" ? "active" : "upcoming",
            onClick: () => setTab("courses")
          },
          {
            number: "02",
            label: "Preferences",
            suffix: <span className="opacity-60">(optional)</span>,
            status: tab === "preferences" ? "active" : "upcoming",
            onClick: () => setTab("preferences")
          },
          {
            number: "03",
            label: "Results",
            status: "upcoming",
            disabled: generatedSchedules.length === 0,
            onClick: generatedSchedules.length > 0 ? () => router.push("/new/results") : undefined
          }
        ]}
      />

      {showNotice ? (
        <div className="flex items-center gap-4 border-b border-fp-border-default px-6 py-[11px]" style={{ backgroundColor: "var(--accent-wash)" }}>
          <FPLabel tone="accent">First time here</FPLabel>
          <span className="text-[13px] text-fp-text-body">
            Add your courses and tick every professor you&apos;d accept &middot; set anything you&apos;d rather avoid &middot; pick from
            the weeks that work.
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("dismissed_preliminary_notice", "true");
              setShowNotice(false);
            }}
            className="fp-label -m-2 ml-auto shrink-0 p-2 text-[11px] text-fp-text-dim hover:text-fp-text-body"
          >
            Got it ✕
          </button>
        </div>
      ) : null}

      {campus && slots.length === 0 ? (
        <div className="border-b border-fp-border-default px-6 py-3">
          <FPNote tone="warn">Slot data for this campus is not available yet. Check back soon.</FPNote>
        </div>
      ) : null}

      {isGenerating || checked > 0 ? (
        <div className="border-b border-fp-border-default px-6 py-4">
          <div className="mb-2 flex items-center justify-between">
            <FPLabel>
              Checked {checked} branches, accepted {accepted}
            </FPLabel>
            <span className="font-fp-mono text-[13px] text-fp-text-strong">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-fp-bg-inset">
            <div
              className="h-full bg-fp-accent transition-[width] duration-200"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          {accepted > 0 && !isGenerating ? (
            <Link href="/new/results" className="mt-3 inline-block">
              <FPButton variant="primary" size="sm">
                Open Results →
              </FPButton>
            </Link>
          ) : null}
        </div>
      ) : null}

      {tab === "courses" ? <FPCoursesPane /> : <FPPreferencesPane />}

      <footer className="flex flex-wrap items-center gap-4 border-t border-fp-border-default bg-fp-bg-surface px-6 py-4">
        <FPLabel>
          {courses.length} courses &middot; {optionCount} professor options
        </FPLabel>
        {generatedSchedules[0] ? (
          <FPLabel tone="accent">Best score {generatedSchedules[0].score}</FPLabel>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          {tab === "courses" ? (
            <FPButton variant="ghost" size="md" onClick={() => setTab("preferences")}>
              Skip to 02
            </FPButton>
          ) : (
            <FPButton variant="secondary" size="md" onClick={() => setTab("courses")}>
              Back
            </FPButton>
          )}
          <FPBadge tone={activeConstraintCount > 0 ? "accent" : "neutral"}>
            {activeConstraintCount} constraints active
          </FPBadge>
          <FPButton variant={isGenerating ? "secondary" : "primary"} size="md" onClick={isGenerating ? cancel : runGeneration}>
            {isGenerating ? "Cancel" : "Find my weeks →"}
          </FPButton>
        </div>
      </footer>
    </div>
  );
}
