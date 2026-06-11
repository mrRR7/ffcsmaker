"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  X
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
import { RankingMode } from "@/engine/types";
import { useGenerator } from "@/hooks/useGenerator";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

const tabs = [
  { id: "search", label: "Search Catalog", mobileLabel: "Search", icon: Search },
  { id: "paste", label: "Paste Text", mobileLabel: "Paste", icon: ClipboardList },
  { id: "import", label: "Import File", mobileLabel: "File", icon: FileUp },
  { id: "manual", label: "Manual Entry", mobileLabel: "Manual", icon: Pencil }
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PlannerPage() {
  const [tab, setTab] = useState<TabId>("search");
  const [showConstraints, setShowConstraints] = useState(false);
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const setRankingMode = useAppStore((state) => state.setRankingMode);
  const setUsePriorityRanking = useAppStore(
    (state) => state.setUsePriorityRanking
  );
  const { generate, cancel, isGenerating, progress, checked, accepted } = useGenerator();

  const optionCount = useMemo(
    () => courses.reduce((sum, course) => sum + course.options.length, 0),
    [courses]
  );

  function runGeneration() {
    generate({
      courses,
      slots,
      constraints,
      rankingMode,
      usePriorityRanking,
      maxResults: 500
    });
  }

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
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard
            label="Generated"
            value={generatedSchedules.length}
            detail={generatedSchedules[0] ? `Best score ${generatedSchedules[0].score}` : "No run yet"}
            icon={GitBranch}
          />
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col h-full">
          <Card className="h-full">
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
                  "mt-3 flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-semibold transition",
                  usePriorityRanking
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
                )}
              >
                Priority ranking
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    usePriorityRanking ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

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

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-lg border border-border bg-card/70 p-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-semibold transition border",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
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
