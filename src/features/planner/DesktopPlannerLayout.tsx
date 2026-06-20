"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import toast from "react-hot-toast";
import {
  ClipboardCheck,
  ClipboardList,
  FileUp,
  GitBranch,
  Pencil,
  Play,
  Search,
  SlidersHorizontal,
  X,
  Info
} from "lucide-react";
import { CreditCounter } from "@/components/CreditCounter";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/form";
import { CatalogSearch } from "@/features/catalog/CatalogSearch";
import { ConstraintPanel } from "@/features/constraints/ConstraintPanel";
import { CourseBuilder } from "@/features/courses/CourseBuilder";
import { ImportManager } from "@/features/import/ImportManager";
import { PasteImport } from "@/features/paste-import/PasteImport";
import { getRankingProfiles } from "@/engine/ranking";
import { CAMPUS_LABELS, RankingMode } from "@/engine/types";
import { usePlannerGeneration } from "./usePlannerGeneration";
import { PLANNER_TABS, PlannerTabId } from "./constants";
import { prewarmCatalogCache } from "@/lib/catalogCache";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

export function DesktopPlannerLayout() {
  const [tab, setTab] = useState<PlannerTabId>("search");
  const [showConstraints, setShowConstraints] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissed_preliminary_notice");
    if (!dismissed) {
      setShowNotice(true);
    }
  }, []);

  function handleDismissNotice() {
    localStorage.setItem("dismissed_preliminary_notice", "true");
    setShowNotice(false);
  }

  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const campus = useAppStore((state) => state.campus);
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const setUsePriorityRanking = useAppStore(
    (state) => state.setUsePriorityRanking
  );
  const { cancel, isGenerating, progress, checked, accepted, runGeneration } = usePlannerGeneration();

  const optionCount = useMemo(
    () => courses.reduce((sum, course) => sum + course.options.length, 0),
    [courses]
  );

  useEffect(() => {
    if (campus) {
      void prewarmCatalogCache(campus);
    }
  }, [campus]);

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader
        title="Planner"
        action={
          <div className="flex flex-wrap gap-2">
            <CreditCounter courses={courses} />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConstraints((current) => !current)}
            >
              {showConstraints ? (
                <X className="h-4 w-4" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
              Constraints
            </Button>
            <Button
              type="button"
              variant={isGenerating ? "secondary" : "default"}
              onClick={isGenerating ? cancel : runGeneration}
            >
              <Play className="h-4 w-4" />
              {isGenerating ? "Cancel" : "Generate"}
            </Button>
          </div>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-5 grid gap-3 md:grid-cols-3"
      >
        <motion.div variants={fadeUp}>
          <StatCard
            label="Courses"
            value={courses.length}
            detail={`${optionCount} professor options`}
            icon={ClipboardCheck}
            className="bg-canvas shadow-none"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Generated"
            value={generatedSchedules.length}
            detail={generatedSchedules[0] ? `Best score ${generatedSchedules[0].score}` : "No run yet"}
            icon={GitBranch}
            className="bg-canvas shadow-none"
          />
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col h-full">
          <Card className="h-full bg-canvas shadow-none">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Ranking Mode</p>
                </div>
                <Badge>{rankingMode}</Badge>
              </div>
              <Select
                className="mt-auto pt-3"
                value={rankingMode}
                onChange={(event) => setRankingMode(event.target.value as RankingMode)}
              >
                {getRankingProfiles().map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setUsePriorityRanking(!usePriorityRanking)}
                className={cn(
                  "mt-3 flex w-full items-center justify-between rounded-md border px-2 py-0.5 text-[12px] font-medium leading-tight transition",
                  usePriorityRanking
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-hairline bg-canvas text-ink hover:bg-surface-soft"
                )}
              >
                Priority ranking
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    usePriorityRanking ? "bg-primary" : "bg-muted/40"
                  )}
                />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {campus && slots.length === 0 ? (
        <Card className="mb-5 border-amber-500/30 bg-amber-500/10 shadow-none">
          <CardContent className="p-4 text-sm text-amber-200">
            Slot data for {CAMPUS_LABELS[campus]} is not available yet. Check back
            soon or contact the maintainers.
          </CardContent>
        </Card>
      ) : null}

      {isGenerating || checked > 0 ? (
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Checked {checked} branches, accepted {accepted}
              </span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            {accepted > 0 && !isGenerating ? (
              <Link
                href="/results"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-none transition hover:bg-primary-hover"
              >
                Open Results
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showConstraints ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <ConstraintPanel />
        </motion.div>
      ) : null}

      {showNotice ? (
        <Card className="mb-5 border-primary/20 bg-primary/5 shadow-none relative overflow-hidden">
          <CardContent className="p-4 flex gap-3 text-sm text-ink pr-10">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Notice</h4>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>
                  Ultimate FFCS is currently in an early rollout phase.
                </p>
                <p>
                  At the moment, faculty and course data has only been uploaded for 2nd Year CSE Core, CSE AIML, EEE, Int. M.tech DS students.
                </p>
                <p>
                  Support for additional programs is actively being added and will be rolled out soon.
                </p>
                <p>
                  If your program is not available yet and you have access to faculty/course allocation data, please get in touch at rakeshrajanikanth@gmail.com or  on insta. Community-contributed data will help expand support significantly faster.
                </p>
                <p>
                  Thank you for your patience while the catalog is being expanded.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissNotice}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-surface-soft hover:text-ink transition"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-hairline bg-canvas/30 p-1">
        {PLANNER_TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium leading-tight transition",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent bg-transparent text-muted hover:bg-surface-soft/40 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="sm:hidden">{item.mobileLabel}</span>
              <span className="hidden sm:inline">
                {item.id === "search" ? `${item.label} *` : item.label}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {tab === "search" ? <CatalogSearch /> : null}
        {tab === "paste" ? <PasteImport /> : null}
        {tab === "import" ? <ImportManager /> : null}
        {tab === "manual" ? <CourseBuilder /> : null}
      </motion.div>
    </div>
  );
}
