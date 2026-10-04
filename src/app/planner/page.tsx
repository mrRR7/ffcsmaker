"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { routeSlide } from "@/utils/motion";
import { useAppStore } from "@/store/useAppStore";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { usePlannerGeneration } from "@/features/planner/usePlannerGeneration";
import { useTour } from "@/features/tour/useTour";
import { loadCatalog } from "@/lib/catalogCache";
import { FPStepNav } from "@/components/fp-ui/step-nav";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { FPCheckbox } from "@/components/fp-ui/checkbox";
import { FPCoursesPane } from "@/features/planner/fp/FPCoursesPane";
import { FPPreferencesPane } from "@/features/planner/fp/FPPreferencesPane";

type PlannerTab = "courses" | "preferences";

export default function NewPlannerPage() {
  const [tab, setTab] = useState<PlannerTab>("courses");
  const [showNotice, setShowNotice] = useState(false);
  const tour = useTour();

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed_preliminary_notice");
    if (!dismissed) setShowNotice(true);
  }, []);

  const campus = useAppStore((state) => state.campus);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const usePriorityRanking = useAppStore((state) => state.uiPreferences.usePriorityRanking);
  const setUsePriorityRanking = useAppStore((state) => state.setUsePriorityRanking);

  const { cancel, isGenerating, accepted, runGeneration } = usePlannerGeneration();

  const rankingProfiles = useMemo(() => getRankingProfiles(), []);
  const slots = useAppStore((state) => state.slots);
  const courseCount = useAppStore((state) => state.courses.length);

  useEffect(() => {
    if (campus) loadCatalog(campus).catch(() => {});
  }, [campus]);

  const findWeeksButton = (
    <FPButton
      data-tour-id="planner-generate"
      variant={isGenerating ? "secondary" : "primary"}
      size="md"
      className="whitespace-nowrap"
      onClick={isGenerating ? cancel : runGeneration}
      disabled={!isGenerating && courseCount === 0}
      title={courseCount === 0 ? "Add a course first" : undefined}
    >
      {isGenerating ? (
        "Cancel"
      ) : (
        <>
          Find my weeks
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </>
      )}
    </FPButton>
  );

  const rankingControls = (
    <>
      <select
        value={rankingMode}
        onChange={(event) => setRankingMode(event.target.value as RankingMode)}
        aria-label="Ranking profile"
        title="How weeks are ordered. Balanced: a bit of everything. Half Days: classes packed into mornings or afternoons. Minimize Gaps: fewest free periods between classes. Early Finish: done early each day. Late Start: later first class."
        className="fp-text rounded-[var(--radius-md)] border border-fp-border-strong bg-transparent px-3 py-[10px] text-[length:var(--text-small)] text-fp-text-body outline-none hover:border-fp-accent"
      >
        {rankingProfiles.map((profile) => (
          <option key={profile} value={profile}>
            {profile}
          </option>
        ))}
      </select>
      <label className="fp-text inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-[length:var(--text-small)] text-fp-text-dim">
        <FPCheckbox checked={usePriorityRanking} onCheckedChange={setUsePriorityRanking} />
        My list order
      </label>
    </>
  );

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
            onClick: () => setTab("preferences"),
            "data-tour-id": "planner-preferences"
          }
        ]}
      />

      {showNotice && !tour.active && courseCount === 0 ? (
        // Desktop only: on phone it pushes the search box below the fold.
        <div className="hidden items-center gap-4 border-b border-fp-border-default px-4 py-[11px] lg:flex lg:px-6" style={{ backgroundColor: "var(--accent-wash)" }}>
          <FPLabel tone="accent">First time here</FPLabel>
          <span className="text-[length:var(--text-small)] text-fp-text-body">
            Add your courses and tick every professor you&apos;d accept &middot; set anything you&apos;d rather avoid &middot; pick from
            the weeks that work.
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("dismissed_preliminary_notice", "true");
              setShowNotice(false);
            }}
            className="fp-text -m-2 ml-auto flex shrink-0 items-center gap-1 p-2 text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-text-body"
          >
            Got it
            <X className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </div>
      ) : null}

      {campus && slots.length === 0 ? (
        <div className="border-b border-fp-border-default px-4 py-3 lg:px-6">
          <FPNote tone="warn">Slot data for this campus is not available yet. Check back soon.</FPNote>
        </div>
      ) : null}

      {!isGenerating && accepted > 0 ? (
        <div className="flex items-center gap-4 border-b border-fp-border-default px-4 py-3 lg:px-6">
          <FPLabel>{accepted} weeks found</FPLabel>
          <Link href="/results">
            <FPButton variant="primary" size="sm">
              Open Results
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </FPButton>
          </Link>
        </div>
      ) : null}

      {/* Step 1 ↔ step 2: same page slide as route changes, direction by step order. */}
      <AnimatePresence mode="wait" custom={tab === "preferences" ? 1 : -1}>
        <motion.div
          key={tab}
          custom={tab === "preferences" ? 1 : -1}
          variants={routeSlide}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {tab === "courses" ? (
            <FPCoursesPane
              actions={
                <>
                  {rankingControls}
                  {findWeeksButton}
                </>
              }
            />
          ) : (
            <FPPreferencesPane
              actions={
                <div className="hidden flex-wrap items-center gap-2.5 lg:flex">
                  {rankingControls}
                  {findWeeksButton}
                </div>
              }
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Phone: the classic skin's pinned bottom action, sitting on the shell's tab bar. */}
      {courseCount > 0 ? (
        <>
          <div className="h-28 lg:hidden" />
          <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-fp-border-default bg-fp-bg-surface px-4 py-2.5 lg:hidden">
            <div className="mb-2 flex items-center gap-3">{rankingControls}</div>
            <div className="flex gap-2">
              {!isGenerating && accepted > 0 ? (
                <Link href="/results" className="flex-1">
                  <FPButton variant="secondary" className="w-full">
                    {accepted} weeks
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </FPButton>
                </Link>
              ) : null}
              <FPButton
                variant={isGenerating ? "secondary" : "primary"}
                className="flex-1"
                onClick={isGenerating ? cancel : runGeneration}
              >
                {isGenerating ? `Cancel · ${accepted} found` : `Find my weeks · ${courseCount} course${courseCount === 1 ? "" : "s"}`}
              </FPButton>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
