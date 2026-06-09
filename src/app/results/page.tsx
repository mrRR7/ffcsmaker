"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import toast from "react-hot-toast";
import { BookmarkPlus, Check, Download, FileJson, FileText, Share2 } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsControlBar } from "@/features/results/ResultsControlBar";
import { ScheduleMetricsStrip } from "@/features/results/ScheduleMetricsStrip";
import { CourseSummaryPanel } from "@/features/results/CourseSummaryPanel";
import { BlockDetailPanel } from "@/features/results/BlockDetailPanel";
import { IcalExportDialog } from "@/features/results/IcalExportDialog";
import { ScheduleBrowser } from "@/features/results/ScheduleBrowser";
import { SlotMatrixTimetable } from "@/features/results/SlotMatrixTimetable";
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
  const activeScheduleId = useAppStore((state) => state.activeScheduleId);
  const setActiveScheduleId = useAppStore((state) => state.setActiveScheduleId);
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const toggleFavoriteSchedule = useAppStore((state) => state.toggleFavoriteSchedule);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const savedSchedules = useAppStore((state) => state.savedSchedules);

  const filteredSchedules = useMemo(() => {
    return [...generatedSchedules].sort((a, b) => {
      if (sortMode === "lowGaps") {
        return a.metrics.totalGapSlots - b.metrics.totalGapSlots || b.score - a.score;
      }
      if (sortMode === "earlyFinish") {
        return a.metrics.latestEndTime.localeCompare(b.metrics.latestEndTime) || b.score - a.score;
      }
      return b.score - a.score;
    });
  }, [generatedSchedules, sortMode]);

  const activeSchedule =
    filteredSchedules.find((schedule) => schedule.id === activeScheduleId) ??
    filteredSchedules[0] ??
    null;

  const activeIndex = useMemo(() => {
    if (!activeSchedule) {
      return -1;
    }
    return filteredSchedules.findIndex((schedule) => schedule.id === activeSchedule.id);
  }, [activeSchedule, filteredSchedules]);

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

      if (filteredSchedules.length === 0) {
        return;
      }

      const currentIndex = activeIndex >= 0 ? activeIndex : 0;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, filteredSchedules.length - 1);
        setActiveScheduleId(filteredSchedules[nextIndex].id);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const previousIndex = Math.max(currentIndex - 1, 0);
        setActiveScheduleId(filteredSchedules[previousIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredSchedules, setActiveScheduleId]);

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

  if (filteredSchedules.length === 0) {
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
        count={filteredSchedules.length}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        actions={toolbarActions}
      />

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {activeSchedule ? (
          <motion.div variants={fadeUp}>
            <ScheduleBrowser
              schedules={filteredSchedules}
              activeSchedule={activeSchedule}
              activeIndex={activeIndex}
              onSelectSchedule={selectSchedule}
              onPrevious={() =>
                selectSchedule(filteredSchedules[Math.max(activeIndex - 1, 0)].id)
              }
              onNext={() =>
                selectSchedule(
                  filteredSchedules[Math.min(activeIndex + 1, filteredSchedules.length - 1)].id
                )
              }
              onToggleFavorite={toggleFavoriteSchedule}
              onAddCompare={addCompareSchedule}
              isFavorite={isFavorite}
            />
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} ref={exportRef} className="relative min-w-0 space-y-4">
          <SlotMatrixTimetable
            schedule={activeSchedule}
            slots={slots}
            courses={courses}
            onCellClick={selectCell}
            highlightCourseCode={highlightCourseCode}
            activeCellId={activeCellId}
          />
        </motion.div>

        {activeSchedule ? (
          <>
            <motion.div variants={fadeUp}>
              <ScheduleMetricsStrip schedule={activeSchedule} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <CourseSummaryPanel
                schedule={activeSchedule}
                slots={slots}
                courses={courses}
                highlightCourseCode={highlightCourseCode}
                previewCourseCode={null}
                onHighlightCourseCodeChange={setHighlightCourseCode}
                onPreviewCourseCodeChange={() => undefined}
              />
            </motion.div>
          </>
        ) : null}
      </motion.div>

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
