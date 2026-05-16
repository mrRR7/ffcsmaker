"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BookmarkPlus,
  Download,
  FileJson,
  FileText,
  GitCompare,
  Share2,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ScoredTimetable } from "@/engine/types";
import { exportElementPdf, exportElementPng, exportScheduleJson } from "@/utils/export";
import { buildShareUrl, createSharedState, encodeSharedState } from "@/utils/share";
import { useAppStore } from "@/store/useAppStore";

export function ScheduleSummaryCard({
  schedule,
  selected = false,
  showPreview = false
}: {
  schedule: ScoredTimetable;
  selected?: boolean;
  showPreview?: boolean;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const setActiveScheduleId = useAppStore((state) => state.setActiveScheduleId);

  const insight = useMemo(() => {
    const best = Object.entries(schedule.scoreBreakdown).sort((a, b) => b[1] - a[1])[0];
    return best ? `${best[0]} contributed ${best[1]} pts` : "Balanced tradeoffs";
  }, [schedule.scoreBreakdown]);
  const totalCredits = schedule.selections.reduce(
    (sum, selection) => sum + selection.credits,
    0
  );

  async function shareSchedule() {
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
    const url = buildShareUrl("/planner", encoded);
    await navigator.clipboard.writeText(url);
    toast.success("Share URL copied.");
  }

  async function exportPreview(type: "png" | "pdf") {
    if (!previewRef.current) {
      toast.error("Open the preview before exporting this view.");
      return;
    }
    try {
      setIsExporting(true);
      if (type === "png") {
        await exportElementPng(previewRef.current, `unitime-${schedule.id}.png`);
      } else {
        await exportElementPdf(previewRef.current, schedule);
      }
      toast.success(`${type.toUpperCase()} export created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card
      className={
        selected
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-card/90"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Score {schedule.score}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{insight}</p>
          </div>
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {schedule.rankingMode}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Metric label="Credits" value={totalCredits} />
          <Metric label="Half days" value={schedule.metrics.halfDays} />
          <Metric label="Gap slots" value={schedule.metrics.totalGapSlots} />
          <Metric label="Ends" value={schedule.metrics.latestEndTime} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveScheduleId(schedule.id)}
          >
            Open
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => saveSchedule(schedule)}
          >
            <BookmarkPlus className="h-4 w-4" />
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addCompareSchedule(schedule.id)}
          >
            <GitCompare className="h-4 w-4" />
            Compare
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={shareSchedule}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exportScheduleJson(schedule)}
          >
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
          {showPreview ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isExporting}
                onClick={() => exportPreview("png")}
              >
                <Download className="h-4 w-4" />
                PNG
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isExporting}
                onClick={() => exportPreview("pdf")}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </>
          ) : null}
          <Link
            href="/compare"
            className="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold transition hover:bg-secondary/70"
          >
            View compare
          </Link>
        </div>
        {showPreview ? (
          <div ref={previewRef}>
            <TimetableGrid schedule={schedule} slots={slots} courses={courses} compact />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
