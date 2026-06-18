"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import toast from "react-hot-toast";
import { BookmarkPlus, Check, Download, FileJson, FileText, Image as ImageIcon, Share2, Table2 } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { ResultDetailView } from "@/components/ResultDetailView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsControlBar } from "@/features/results/ResultsControlBar";
import { ScheduleMetricsStrip } from "@/features/results/ScheduleMetricsStrip";
import { CourseSummaryPanel } from "@/features/results/CourseSummaryPanel";
import { BlockDetailPanel } from "@/features/results/BlockDetailPanel";
import { IcalExportDialog } from "@/features/results/IcalExportDialog";
import { ShareCardModal } from "@/features/results/ShareCardModal";
import { ScheduleBrowser } from "@/features/results/ScheduleBrowser";
import { SlotMatrixTimetable } from "@/features/results/SlotMatrixTimetable";
import { ShapeNavigator } from "@/features/results/ShapeNavigator";
import { VariantSwitcher } from "@/features/results/VariantSwitcher";
import { buildMatrixCells, MatrixCell } from "@/features/results/timetableMatrix";
import { ScoredTimetable } from "@/engine/types";
import { exportElementPng, exportScheduleJson, exportTimetablePdf } from "@/utils/export";
import { createSharedTimetableUrl } from "@/utils/share";
import { useAppStore } from "@/store/useAppStore";

type SortMode = "score" | "lowGaps" | "earlyFinish";

function ResultsContent() {
  const exportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [activeBlockAnchor, setActiveBlockAnchor] = useState<DOMRect | null>(null);
  const [highlightCourseCode, setHighlightCourseCode] = useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = useState(false);

  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const constraints = useAppStore((state) => state.constraints);
  const rankingMode = useAppStore((state) => state.rankingMode);
  const usePriorityRanking = useAppStore(
    (state) => state.uiPreferences.usePriorityRanking
  );
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const generatedShapeGroups = useAppStore((state) => state.generatedShapeGroups);
  const generatedAt = useAppStore((state) => state.generatedAt);
  const activeShapeId = useAppStore((state) => state.activeShapeId);
  const activeVariantId = useAppStore((state) => state.activeVariantId);
  const setActiveShapeId = useAppStore((state) => state.setActiveShapeId);
  const setActiveVariantId = useAppStore((state) => state.setActiveVariantId);
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const toggleFavoriteSchedule = useAppStore((state) => state.toggleFavoriteSchedule);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const savedSchedules = useAppStore((state) => state.savedSchedules);

  // --- Derived state ---

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

  // Resolve active shape group from shapeId
  const activeShapeGroup = useMemo(() => {
    return (
      filteredGroups.find((g) => g.shapeId === activeShapeId) ??
      filteredGroups[0] ??
      null
    );
  }, [filteredGroups, activeShapeId]);

  // All variants within the active shape, sorted by score
  const allVariants = useMemo(() => {
    if (!activeShapeGroup) return [];
    const map = new Map<string, ScoredTimetable>();
    map.set(activeShapeGroup.representative.id, activeShapeGroup.representative);
    activeShapeGroup.alternatives.forEach(alt => map.set(alt.id, alt));
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [activeShapeGroup]);

  // Resolve active schedule from variantId
  const activeSchedule = useMemo(() => {
    if (allVariants.length === 0) return null;
    return allVariants.find((v) => v.id === activeVariantId) ?? allVariants[0];
  }, [allVariants, activeVariantId]);

  // Compute shape index for display
  const activeShapeIndex = useMemo(() => {
    if (!activeShapeGroup) return -1;
    return filteredGroups.findIndex((g) => g.shapeId === activeShapeGroup.shapeId);
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
  const resultsAreStale =
    generatedAt !== null && Date.now() - generatedAt > 24 * 60 * 60 * 1000;

  // --- Keyboard navigation (shapes) ---

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

      const currentShapeIndex = activeShapeIndex >= 0 ? activeShapeIndex : 0;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(currentShapeIndex + 1, filteredGroups.length - 1);
        const nextGroup = filteredGroups[nextIndex];
        setActiveShapeId(nextGroup.shapeId);
        setActiveVariantId(nextGroup.representative.id);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const previousIndex = Math.max(currentShapeIndex - 1, 0);
        const prevGroup = filteredGroups[previousIndex];
        setActiveShapeId(prevGroup.shapeId);
        setActiveVariantId(prevGroup.representative.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeShapeIndex, filteredGroups, setActiveShapeId, setActiveVariantId]);

  // --- Reset cell focus when schedule changes ---

  useEffect(() => {
    if (!activeSchedule) {
      return;
    }

    setActiveCellId(null);
    setActiveBlockAnchor(null);
    setHighlightCourseCode((current) =>
      current && activeSchedule.selections.some((selection) => selection.courseCode === current)
        ? current
        : null
    );
  }, [activeSchedule]);

  // --- URL Sync: Load shape/variant from URL on mount ---

  useEffect(() => {
    const urlShapeId = searchParams.get("shape");
    const urlVariantId = searchParams.get("variant");

    if (urlShapeId && urlShapeId !== activeShapeId) {
      const groupExists = generatedShapeGroups.some(g => g.shapeId === urlShapeId);
      if (groupExists) {
        setActiveShapeId(urlShapeId);
        if (urlVariantId) {
          setActiveVariantId(urlVariantId);
        }
      }
    } else if (urlVariantId && urlVariantId !== activeVariantId) {
      setActiveVariantId(urlVariantId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- URL Sync: Update URL when active shape/variant changes ---

  useEffect(() => {
    if (!activeShapeGroup || !activeSchedule) return;

    const currentShape = searchParams.get("shape");
    const currentVariant = searchParams.get("variant");

    if (currentShape !== activeShapeGroup.shapeId || currentVariant !== activeSchedule.id) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("shape", activeShapeGroup.shapeId);
      newParams.set("variant", activeSchedule.id);
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [activeShapeGroup, activeSchedule, pathname, router, searchParams]);

  // --- Handlers ---

  function selectShape(shapeId: string) {
    const group = filteredGroups.find(g => g.shapeId === shapeId);
    if (group) {
      setActiveShapeId(group.shapeId);
      setActiveVariantId(group.representative.id);
      setActiveCellId(null);
      setActiveBlockAnchor(null);
    }
  }

  function selectVariant(variantId: string) {
    setActiveVariantId(variantId);
    setActiveCellId(null);
    setActiveBlockAnchor(null);
  }

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
    console.log(exportTimetablePdf);
    console.log("EXPORT ACTIVE", type);
    if (!activeSchedule || !exportRef.current) {
      return;
    }

    try {
      if (type === "png") {
        await exportElementPng(exportRef.current, `ultimate-ffcs-${activeSchedule.id}.png`);
      } else {
        if (type === "pdf") {
  alert("BEFORE PDF CALL");

  await exportTimetablePdf(
    activeSchedule,
    slots,
    courses
  );

  alert("AFTER PDF CALL");
}

debugger;

await exportTimetablePdf(activeSchedule, slots, courses);

console.log("AFTER PDF");
      }
      toast.success(`${type.toUpperCase()} export created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    }
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

  // --- Empty states ---

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
          schedulesCount={generatedSchedules.length}
          shapesCount={0}
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

  // --- Toolbar actions ---

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
        onClick={() => setShareCardOpen(true)}
      >
        <ImageIcon className="h-4 w-4" />
        Share image
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
    </>
  ) : null;

  // --- Main render ---

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <ResultsControlBar
        schedulesCount={generatedSchedules.length}
        shapesCount={filteredGroups.length}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        actions={toolbarActions}
      />

      {resultsAreStale ? (
        <Card className="border-amber-500/30 bg-amber-500/10 shadow-none">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <span>These results are over 24 hours old. Regenerate for the latest schedule.</span>
            <Link
              href="/planner"
              className="inline-flex h-9 items-center justify-center rounded-md border border-amber-300/40 px-3 text-sm font-semibold transition hover:bg-amber-400/10"
            >
              Redo
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {/* Shape Navigator */}
      <ShapeNavigator
        groups={filteredGroups}
        activeShapeId={activeShapeGroup?.shapeId ?? ""}
        onSelect={selectShape}
      />

      {/* Variant Switcher */}
      {activeShapeGroup && allVariants.length > 1 && (
        <VariantSwitcher
          group={activeShapeGroup}
          activeVariantId={activeSchedule?.id ?? ""}
          courses={courses}
          onSelectVariant={selectVariant}
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

      {activeSchedule ? (
        <ShareCardModal
          open={shareCardOpen}
          onClose={() => setShareCardOpen(false)}
          schedule={activeSchedule}
          slots={slots}
        />
      ) : null}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
