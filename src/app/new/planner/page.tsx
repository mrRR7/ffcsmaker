"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUp } from "@/utils/motion";
import { useAppStore } from "@/store/useAppStore";
import { getRankingProfiles } from "@/engine/ranking";
import { RankingMode } from "@/engine/types";
import { usePlannerGeneration } from "@/features/planner/usePlannerGeneration";
import { prewarmCatalogCache } from "@/lib/catalogCache";
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

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed_preliminary_notice");
    if (!dismissed) setShowNotice(true);
  }, []);

  const campus = useAppStore((state) => state.campus);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const usePriorityRanking = useAppStore((state) => state.uiPreferences.usePriorityRanking);
  const setUsePriorityRanking = useAppStore((state) => state.setUsePriorityRanking);

  const { cancel, isGenerating, progress, checked, accepted, runGeneration } = usePlannerGeneration();

  const rankingProfiles = useMemo(() => getRankingProfiles(), []);
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
          }
        ]}
      />

      {showNotice ? (
        <div className="flex items-center gap-4 border-b border-fp-border-default px-6 py-[11px]" style={{ backgroundColor: "var(--accent-wash)" }}>
          <FPLabel tone="accent">First time here</FPLabel>
          <span className="text-[var(--text-small)] text-fp-text-body">
            Add your courses and tick every professor you&apos;d accept &middot; set anything you&apos;d rather avoid &middot; pick from
            the weeks that work.
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("dismissed_preliminary_notice", "true");
              setShowNotice(false);
            }}
            className="fp-label -m-2 ml-auto flex shrink-0 items-center gap-1 p-2 text-[var(--text-micro)] text-fp-text-dim hover:text-fp-text-body"
          >
            Got it
            <X className="h-3 w-3" strokeWidth={1.5} />
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
            <span className="font-fp-mono text-[var(--text-small)] text-fp-text-strong">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-fp-bg-inset">
            <div
              className="h-full bg-fp-accent transition-[width] duration-[var(--dur-base)]"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          {accepted > 0 && !isGenerating ? (
            <Link href="/new/results" className="mt-3 inline-block">
              <FPButton variant="primary" size="sm">
                Open Results
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </FPButton>
            </Link>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={fadeUp} initial="initial" animate="animate" exit="exit">
          {tab === "courses" ? (
            <FPCoursesPane
              actions={
                <>
                  <select
                    value={rankingMode}
                    onChange={(event) => setRankingMode(event.target.value as RankingMode)}
                    aria-label="Ranking profile"
                    className="fp-label rounded-[var(--radius-md)] border border-fp-border-strong bg-transparent px-2.5 py-[7px] text-[var(--text-micro)] text-fp-text-body outline-none hover:border-fp-accent"
                  >
                    {rankingProfiles.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                  <label className="fp-label inline-flex cursor-pointer items-center gap-1.5 text-[var(--text-micro)] text-fp-text-dim">
                    <FPCheckbox checked={usePriorityRanking} onCheckedChange={setUsePriorityRanking} />
                    My list order
                  </label>
                  <FPButton
                    variant={isGenerating ? "secondary" : "primary"}
                    size="sm"
                    onClick={isGenerating ? cancel : runGeneration}
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
                </>
              }
            />
          ) : (
            <FPPreferencesPane />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
