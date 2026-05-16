"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, FileJson, FileText, Share2, SlidersHorizontal } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { TimetableGrid } from "@/components/TimetableGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { ScheduleSummaryCard } from "@/features/schedules/ScheduleSummaryCard";
import { ScoredTimetable } from "@/engine/types";
import { exportElementPdf, exportElementPng, exportScheduleJson } from "@/utils/export";
import { buildShareUrl, createSharedState, encodeSharedState } from "@/utils/share";
import { useAppStore } from "@/store/useAppStore";

type SortMode = "score" | "lowGaps" | "earlyFinish";

export default function ResultsPage() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [minScore, setMinScore] = useState("");
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const activeScheduleId = useAppStore((state) => state.activeScheduleId);
  const setActiveScheduleId = useAppStore((state) => state.setActiveScheduleId);

  const filteredSchedules = useMemo(() => {
    const min = minScore ? Number(minScore) : 0;
    const schedules = generatedSchedules.filter((schedule) => schedule.score >= min);
    return [...schedules].sort((a, b) => {
      if (sortMode === "lowGaps") {
        return a.metrics.totalGapSlots - b.metrics.totalGapSlots || b.score - a.score;
      }
      if (sortMode === "earlyFinish") {
        return a.metrics.latestEndTime.localeCompare(b.metrics.latestEndTime) || b.score - a.score;
      }
      return b.score - a.score;
    });
  }, [generatedSchedules, minScore, sortMode]);

  const activeSchedule =
    filteredSchedules.find((schedule) => schedule.id === activeScheduleId) ??
    filteredSchedules[0] ??
    null;

  async function shareActive(schedule: ScoredTimetable) {
    const encoded = encodeSharedState(
      createSharedState({
        slots,
        courses,
        constraints,
        rankingMode,
        usePriorityRanking,
        activeSchedule: schedule
      })
    );
    await navigator.clipboard.writeText(buildShareUrl("/planner", encoded));
    toast.success("Schedule URL copied.");
  }

  async function exportActive(type: "png" | "pdf") {
    if (!activeSchedule || !exportRef.current) {
      return;
    }
    try {
      if (type === "png") {
        await exportElementPng(exportRef.current, `unitime-${activeSchedule.id}.png`);
      } else {
        await exportElementPdf(exportRef.current, activeSchedule);
      }
      toast.success(`${type.toUpperCase()} export created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    }
  }

  if (generatedSchedules.length === 0) {
    return (
      <div className="pb-20 lg:pb-0">
        <SectionHeader
          eyebrow="Results"
          title="Schedule Explorer"
          description="No generated schedules are available yet."
        />
        <Card className="flex min-h-96 items-center justify-center text-center">
          <CardContent>
            <p className="text-lg font-semibold">Run the generator first.</p>
            <Link
              href="/planner"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Open Planner
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeader
        eyebrow="Results"
        title="Schedule Explorer"
        description={`${filteredSchedules.length} ranked schedules from the latest generation run.`}
        action={
          activeSchedule ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => shareActive(activeSchedule)}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button type="button" variant="outline" onClick={() => exportScheduleJson(activeSchedule)}>
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button type="button" variant="outline" onClick={() => exportActive("png")}>
                <Download className="h-4 w-4" />
                PNG
              </Button>
              <Button type="button" onClick={() => exportActive("pdf")}>
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          ) : null
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Sort and filter</p>
              <p className="text-sm text-muted-foreground">Tune the explorer list.</p>
            </div>
          </CardContent>
        </Card>
        <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="score">Best score</option>
          <option value="lowGaps">Lowest gaps</option>
          <option value="earlyFinish">Earliest finish</option>
        </Select>
        <Input
          type="number"
          value={minScore}
          onChange={(event) => setMinScore(event.target.value)}
          placeholder="Min score"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <div ref={exportRef}>
          <TimetableGrid schedule={activeSchedule} slots={slots} courses={courses} />
        </div>
        <div className="space-y-3">
          {activeSchedule ? (
            <div className="flex flex-wrap gap-2">
              <Badge>Compactness {activeSchedule.metrics.compactness}</Badge>
              <Badge>{activeSchedule.metrics.activeDays} active days</Badge>
              <Badge>{activeSchedule.metrics.totalGapSlots} gap slots</Badge>
              <Badge>Average end {activeSchedule.metrics.averageEndTime}</Badge>
            </div>
          ) : null}
          <div className="max-h-[780px] space-y-3 overflow-y-auto pr-1">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => setActiveScheduleId(schedule.id)}
                className="cursor-pointer"
              >
                <ScheduleSummaryCard
                  schedule={schedule}
                  selected={schedule.id === activeSchedule?.id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
