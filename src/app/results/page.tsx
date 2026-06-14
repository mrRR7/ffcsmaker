"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import toast from "react-hot-toast";
import { BookmarkPlus, Check, Download, FileJson, FileText, Share2, Table2 } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { ResultDetailView } from "@/components/ResultDetailView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsControlBar } from "@/features/results/ResultsControlBar";
import { ScheduleMetricsStrip } from "@/features/results/ScheduleMetricsStrip";
import { CourseSummaryPanel } from "@/features/results/CourseSummaryPanel";
import { BlockDetailPanel } from "@/features/results/BlockDetailPanel";
import { IcalExportDialog } from "@/features/results/IcalExportDialog";
import { ScheduleBrowser } from "@/features/results/ScheduleBrowser";
import { SlotMatrixTimetable } from "@/features/results/SlotMatrixTimetable";
import { VariantSwitcher } from "@/features/results/VariantSwitcher";
import { buildMatrixCells, MatrixCell } from "@/features/results/timetableMatrix";
import { ScoredTimetable } from "@/engine/types";
import { exportElementPng, exportScheduleJson, exportTimetablePdf } from "@/utils/export";
import { createSharedTimetableUrl } from "@/utils/share";
import { useAppStore } from "@/store/useAppStore";

type SortMode = "score" | "lowGaps" | "earlyFinish";

export default function ResultsPage() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [activeBlockAnchor, setActiveBlockAnchor] = useState<DOMRect | null>(null);
  const [highlightCourseCode, setHighlightCourseCode] = useState<string | null>(null);

  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const generatedShapeGroups = useAppStore((state) => state.generatedShapeGroups);
  const activeScheduleId = useAppStore((state) => state.activeScheduleId);
  const setActiveScheduleId = useAppStore((state) => state.setActiveScheduleId);
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const toggleFavoriteSchedule = useAppStore((state) => state.toggleFavoriteSchedule);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const savedSchedules = useAppStore((state) => state.savedSchedules);

  const filteredGroups = useMemo(() => {
    return [...generatedShapeGroups].sort((a, b) => {
      const repA = a.representative;
      const repB = b.representative;
      if (sortMode === "lowGaps") {
        return repA.metrics.totalGapSlots - repB.metrics.totalGapSlots || repB.score - repA.score;
      }
      if (sortMode === "earlyFinish") {
        return repA.metrics.latestEndTime.localeCompare(repB.metrics.latestEndTime) || repB.score - repA.score;
      }
      return repB.score - repA.score;
    });
  }, [generatedShapeGroups, sortMode]);

  const activeShapeGroup = useMemo(() => {
    return (
      filteredGroups.find(
        (g) =>
          g.representative.id === activeScheduleId ||
          g.alternatives.some((alt) => alt.id === activeScheduleId)
      ) ??
      filteredGroups[0] ??
      null
    );
  }, [filteredGroups, activeScheduleId]);

  const activeSchedule = useMemo(() => {
    if (!activeShapeGroup) return null;
    if (activeShapeGroup.representative.id === activeScheduleId) return activeShapeGroup.representative;
    return activeShapeGroup.alternatives.find(a => a.id === activeScheduleId) ?? activeShapeGroup.representative;
  }, [activeShapeGroup, activeScheduleId]);

  const activeIndex = useMemo(() => {
    if (!activeShapeGroup) {
      return -1;
    }
    return filteredGroups.findIndex((group) => group.shapeFingerprint === activeShapeGroup.shapeFingerprint);
  }, [activeShapeGroup, filteredGroups]);

  const activeCells = useMemo(
    () => (activeSchedule ? buildMatrixCells(activeSchedule, slots, courses) : null),
    [activeSchedule, slots, courses]
  );

  const flattenedCells = useMemo(
    () => (activeCells ? [...activeCells.theory.flat(), ...activeCells.lab.flat()] : []),
    [activeCells]
  );

  const activeCell = useMemo(
    () => flattenedCells.find((cell) => cell.id === activeCellId) ?? null,
    [activeCellId, flattenedCells]
  );

  const isFavorite = useMemo(() => {
    if (!activeSchedule) {
      return false;
    }
    return savedSchedules.some(
      (saved) => saved.timetable.id === activeSchedule.id && saved.favorite
    );
  }, [activeSchedule, savedSchedules]);
  const isSaved = Boolean(
    activeSchedule &&
      savedSchedules.some((saved) => saved.timetable.id === activeSchedule.id)
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (filteredGroups.length === 0) {
        return;
      }

      const currentIndex = activeIndex >= 0 ? activeIndex : 0;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, filteredGroups.length - 1);
        setActiveScheduleId(filteredGroups[nextIndex].representative.id);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const previousIndex = Math.max(currentIndex - 1, 0);
        setActiveScheduleId(filteredGroups[previousIndex].representative.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredGroups, setActiveScheduleId]);

  useEffect(() => {
    if (!activeSchedule) {
      return;
    }

    if (activeScheduleId !== activeSchedule.id) {
      setActiveScheduleId(activeSchedule.id);
    }

    setActiveCellId(null);
    setActiveBlockAnchor(null);
    setHighlightCourseCode((current) =>
      current && activeSchedule.selections.some((selection) => selection.courseCode === current)
        ? current
        : null
    );
  }, [activeSchedule, activeScheduleId, setActiveScheduleId]);

  async function shareActive(schedule: ScoredTimetable) {
    try {
      const url = await createSharedTimetableUrl({
        schedule,
        slots,
        courses,
        metrics: schedule.metrics,
        score: schedule.score,
        generatedAt: new Date().toISOString(),
      });
      await navigator.clipboard.writeText(url);
      toast.success("Shared timetable URL copied.");
    } catch (err) {
      toast.error("Failed to share timetable.");
    }
  }

  async function exportActive(type: "png" | "pdf") {
    if (!activeSchedule || !exportRef.current) {
      return;
    }

    try {
      if (type === "png") {
        await exportElementPng(exportRef.current, `ultimate-ffcs-${activeSchedule.id}.png`);
      } else {
        await exportTimetablePdf(activeSchedule, slots, courses);
      }
      toast.success(`${type.toUpperCase()} export created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    }
  }

  function selectSchedule(scheduleId: string) {
    setActiveScheduleId(scheduleId);
    setActiveCellId(null);
    setActiveBlockAnchor(null);
  }

  function selectCell(cell: MatrixCell, anchor: DOMRect) {
    setActiveCellId(cell.id);
    setActiveBlockAnchor(anchor);
    if (cell.courseCode) {
      setHighlightCourseCode(cell.courseCode);
    }
  }

  function clearBlockFocus() {
    setActiveCellId(null);
    setActiveBlockAnchor(null);
  }

  function saveActive(schedule: ScoredTimetable) {
    saveSchedule(schedule);
    toast.success(isSaved ? "Saved timetable updated." : "Timetable saved locally.");
  }

  if (generatedSchedules.length === 0) {
    return (
      <div className="pb-20 lg:pb-0">
        <SectionHeader title="Results" />
        <Card className="flex min-h-96 items-center justify-center text-center border-primary/20 bg-primary/5">
          <CardContent className="max-w-md">
            <Table2 className="mx-auto mb-4 h-10 w-10 text-primary/70" />
            <p className="text-lg font-semibold">No schedules generated yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the optimizer to generate schedules.
            </p>
            <Link
              href="/planner"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-hover transition"
            >
              Open Planner
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="space-y-4 pb-20 lg:pb-0">
        <ResultsControlBar
          count={0}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
        />
        <Card className="flex min-h-72 items-center justify-center text-center">
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">No schedules match the current filters.</p>
            <p className="text-sm text-muted-foreground">
              Change the sort mode or regenerate schedules to bring results back into view.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toolbarActions = activeSchedule ? (
    <>
      <Button
        type="button"
        variant={isSaved ? "secondary" : "default"}
        onClick={() => saveActive(activeSchedule)}
      >
        {isSaved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
        {isSaved ? "Saved" : "Save Timetable"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => shareActive(activeSchedule)}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => exportScheduleJson(activeSchedule)}
      >
        <FileJson className="h-4 w-4" />
        JSON
      </Button>
      <IcalExportDialog schedule={activeSchedule} slots={slots} />
      <Button type="button" variant="outline" onClick={() => exportActive("png") }>
        <Download className="h-4 w-4" />
        PNG
      </Button>
      <Button type="button" onClick={() => exportActive("pdf") }>
        <FileText className="h-4 w-4" />
        PDF
      </Button>
    </>
  ) : null;

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <ResultsControlBar
        count={filteredGroups.length}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        actions={toolbarActions}
      />

      {activeShapeGroup && activeShapeGroup.alternatives.length > 0 && (
        <VariantSwitcher
          group={activeShapeGroup}
          activeScheduleId={activeSchedule!.id}
          courses={courses}
          onSelect={selectSchedule}
        />
      )}

      <ResultDetailView
        snapshot={{
          schedule: activeSchedule!,
          slots,
          courses,
          metrics: activeSchedule!.metrics,
          score: activeSchedule!.score,
          generatedAt: new Date().toISOString(),
        }}
      />

      <BlockDetailPanel
        block={activeCell}
        schedule={activeSchedule}
        courses={courses}
        onClose={clearBlockFocus}
        anchorRect={activeBlockAnchor}
        mode="selected"
      />
    </div>
  );
}
