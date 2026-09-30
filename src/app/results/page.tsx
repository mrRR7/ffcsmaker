"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/utils/motion";
import { ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react";
import { FPButton } from "@/components/fp-ui/button";
import { FPCard } from "@/components/fp-ui/card";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPLabel } from "@/components/fp-ui/label";
import { FPMetricRun } from "@/components/fp-ui/metric-run";
import { FPNote } from "@/components/fp-ui/note";
import { FPComboCard } from "@/components/fp-ui/combo-card";
import { FPSlotTable, FP_EMPTY_CELL } from "@/components/fp-ui/slot-table";
import { FPSlotMatrixTimetable } from "@/components/fp-ui/slot-matrix-timetable";
import { useCountUp } from "@/components/fp-ui/use-count-up";
import { BlockDetailPanel } from "@/features/results/BlockDetailPanel";
import { IcalExportDialog } from "@/features/results/IcalExportDialog";
import { ShareCardModal } from "@/features/results/ShareCardModal";
import { buildMatrixCells, buildCourseSummaryRows, MatrixCell } from "@/features/results/timetableMatrix";
import { ScoredTimetable, DayOfWeek } from "@/engine/types";
import { exportElementPng, exportScheduleJson, exportTimetablePdf } from "@/utils/export";
import { createSharedTimetableUrl } from "@/utils/share";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { ZeroResultsFP } from "./ZeroResultsFP";
import { GeneratingFP } from "./GeneratingFP";
import { buildShapeThumbnail, freeDayNames, shortDay } from "./resultsVisuals";

type SortMode = "score" | "lowGaps" | "earlyFinish";

function splitSlotGroup(group: string): { code: string; detail: string } {
  const match = group.match(/^(.*?)\s\((.*)\)$/);
  if (!match) return { code: group, detail: "" };
  return { code: match[1], detail: match[2] };
}

function formatRelativeTime(ms: number | null): string {
  if (ms === null) return "not generated";
  const deltaSec = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (deltaSec < 60) return "just now";
  const deltaMin = Math.round(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin}m ago`;
  const deltaHr = Math.round(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr}h ago`;
  return `${Math.round(deltaHr / 24)}d ago`;
}

function buildSlotListText(schedule: ScoredTimetable): string {
  return schedule.selections
    .map((selection) => `${selection.courseCode} — ${selection.displaySlots.join(", ")}`)
    .join("\n");
}

function ResultsContent() {
  const exportRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [activeBlockAnchor, setActiveBlockAnchor] = useState<DOMRect | null>(null);
  const [highlightCourseCode, setHighlightCourseCode] = useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Generating screen → results hand-off: "loading" while the worker runs,
  // "leaving" for one reveal duration (loader blurs out), then the results
  // mount with the matching blur-in. `revealed` marks that entrance.
  const generationRunning = useAppStore((state) => state.generation.running);
  const [phase, setPhase] = useState<"loading" | "leaving" | "idle">(generationRunning ? "loading" : "idle");
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (generationRunning) setPhase("loading");
    else setPhase((current) => (current === "loading" ? "leaving" : current));
  }, [generationRunning]);
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => {
      setPhase("idle");
      setRevealed(true);
    }, 400); // --reveal-dur
    return () => window.clearTimeout(timer);
  }, [phase]);

  const slots = useAppStore((state) => state.slots);
  const courses = useAppStore((state) => state.courses);
  const generatedSchedules = useAppStore((state) => state.generatedSchedules);
  const generatedShapeGroups = useAppStore((state) => state.generatedShapeGroups);
  const generatedAt = useAppStore((state) => state.generatedAt);
  const activeShapeId = useAppStore((state) => state.activeShapeId);
  const activeVariantId = useAppStore((state) => state.activeVariantId);
  const setActiveShapeId = useAppStore((state) => state.setActiveShapeId);
  const setActiveVariantId = useAppStore((state) => state.setActiveVariantId);
  const saveSchedule = useAppStore((state) => state.saveSchedule);
  const addCompareSchedule = useAppStore((state) => state.addCompareSchedule);
  const compareScheduleIds = useAppStore((state) => state.compareScheduleIds);
  const savedSchedules = useAppStore((state) => state.savedSchedules);

  // --- Derived state (verbatim from the classic /results page) ---

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
    return filteredGroups.find((g) => g.shapeId === activeShapeId) ?? filteredGroups[0] ?? null;
  }, [filteredGroups, activeShapeId]);

  const allVariants = useMemo(() => {
    if (!activeShapeGroup) return [];
    const map = new Map<string, ScoredTimetable>();
    map.set(activeShapeGroup.representative.id, activeShapeGroup.representative);
    activeShapeGroup.alternatives.forEach((alt) => map.set(alt.id, alt));
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [activeShapeGroup]);

  const activeSchedule = useMemo(() => {
    if (allVariants.length === 0) return null;
    return allVariants.find((v) => v.id === activeVariantId) ?? allVariants[0];
  }, [allVariants, activeVariantId]);

  const displayedScore = useCountUp(activeSchedule?.score ?? 0);

  const hasUnverifiedProfessor = useMemo(() => {
    if (!activeSchedule) return false;
    return activeSchedule.selections.some((selection) => {
      const course = courses.find((c) => c.id === selection.courseId);
      const option = course?.options.find((item) => item.id === selection.optionId);
      return !option || option.professorRating === undefined;
    });
  }, [activeSchedule, courses]);

  const activeShapeIndex = useMemo(() => {
    if (!activeShapeGroup) return -1;
    return filteredGroups.findIndex((g) => g.shapeId === activeShapeGroup.shapeId);
  }, [activeShapeGroup, filteredGroups]);

  const activeVariantIndex = useMemo(
    () => allVariants.findIndex((v) => v.id === activeSchedule?.id),
    [allVariants, activeSchedule]
  );

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

  const isSaved = Boolean(
    activeSchedule && savedSchedules.some((saved) => saved.timetable.id === activeSchedule.id)
  );
  const resultsAreStale = generatedAt !== null && Date.now() - generatedAt > 24 * 60 * 60 * 1000;

  const summaryRows = useMemo(
    () => (activeSchedule ? buildCourseSummaryRows(activeSchedule, slots, courses) : []),
    [activeSchedule, slots, courses]
  );

  const totalCredits = useMemo(
    () => (activeSchedule ? activeSchedule.selections.reduce((sum, s) => sum + s.credits, 0) : 0),
    [activeSchedule]
  );

  const freeDays = useMemo(
    () => (activeSchedule ? freeDayNames(activeSchedule, slots) : []),
    [activeSchedule, slots]
  );

  // --- Keyboard navigation (shapes) — verbatim ---

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
      if (filteredGroups.length === 0) return;

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

  // --- Reset cell focus when schedule changes — verbatim ---

  useEffect(() => {
    if (!activeSchedule) return;
    setActiveCellId(null);
    setActiveBlockAnchor(null);
    setHighlightCourseCode((current) =>
      current && activeSchedule.selections.some((selection) => selection.courseCode === current)
        ? current
        : null
    );
  }, [activeSchedule]);

  // --- URL sync — verbatim ---

  useEffect(() => {
    const urlShapeId = searchParams.get("shape");
    const urlVariantId = searchParams.get("variant");
    if (urlShapeId && urlShapeId !== activeShapeId) {
      const groupExists = generatedShapeGroups.some((g) => g.shapeId === urlShapeId);
      if (groupExists) {
        setActiveShapeId(urlShapeId);
        if (urlVariantId) setActiveVariantId(urlVariantId);
      }
    } else if (urlVariantId && urlVariantId !== activeVariantId) {
      setActiveVariantId(urlVariantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    const group = filteredGroups.find((g) => g.shapeId === shapeId);
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

  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Export menu: close on outside click / Escape like every other popover.
  useEffect(() => {
    if (!exportMenuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) setExportMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportMenuOpen]);
  const [exportingType, setExportingType] = useState<"png" | "pdf" | null>(null);

  async function shareActive(schedule: ScoredTimetable) {
    setIsSharing(true);
    try {
      const url = await createSharedTimetableUrl({
        schedule,
        slots,
        courses,
        metrics: schedule.metrics,
        score: schedule.score,
        generatedAt: new Date().toISOString()
      });
      setShareUrl(url);
      // Clipboard can reject after the network await (user activation
      // expired); the link stays on screen either way, so this is best-effort.
      navigator.clipboard.writeText(url).then(
        () => toast.success("Share link copied."),
        () => undefined
      );
    } catch {
      toast.error("Failed to share timetable.");
    } finally {
      setIsSharing(false);
    }
  }

  async function exportActive(type: "png" | "pdf") {
    if (!activeSchedule || !exportRef.current) return;
    setExportingType(type);
    try {
      if (type === "png") {
        await exportElementPng(exportRef.current, `ultimate-ffcs-${activeSchedule.id}.png`);
      } else {
        await exportTimetablePdf(activeSchedule, slots, courses);
      }
      toast.success(`${type.toUpperCase()} export created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExportingType(null);
      setExportMenuOpen(false);
    }
  }

  function selectCell(cell: MatrixCell, anchor: DOMRect) {
    setActiveCellId(cell.id);
    setActiveBlockAnchor(anchor);
    if (cell.courseCode) setHighlightCourseCode(cell.courseCode);
  }

  function clearBlockFocus() {
    setActiveCellId(null);
    setActiveBlockAnchor(null);
  }

  function saveActive(schedule: ScoredTimetable) {
    saveSchedule(schedule);
    toast.success(isSaved ? "Saved timetable updated." : "Timetable saved locally.");
  }

  function copySlotList(schedule: ScoredTimetable) {
    navigator.clipboard
      .writeText(buildSlotListText(schedule))
      .then(() => toast.success("Slot list copied."))
      .catch(() => toast.error("Could not copy slot list."));
  }

  function registerWeek(schedule: ScoredTimetable) {
    saveSchedule(schedule);
    navigator.clipboard
      .writeText(buildSlotListText(schedule))
      .then(() => toast.success("Saved, and slot codes copied — paste into VTOP."))
      .catch(() => toast.success("Saved to your weeks."));
  }

  function optionIdFor(variant: ScoredTimetable, courseId: string) {
    return variant.selections.find((s) => s.courseId === courseId)?.optionId;
  }

  function swapProfessorTo(courseId: string, optionId: string) {
    if (!activeSchedule) return;
    const withOption = allVariants.filter((v) => optionIdFor(v, courseId) === optionId);
    // Prefer the variant that changes only this course's professor.
    const exact = withOption.find((v) =>
      v.selections.every(
        (s) => s.courseId === courseId || optionIdFor(activeSchedule, s.courseId) === s.optionId
      )
    );
    const target = exact ?? withOption[0];
    if (!target) return;
    selectVariant(target.id);
    // Briefly spotlight the swapped course so the change is visible in the grid.
    const code = target.selections.find((s) => s.courseId === courseId)?.courseCode ?? null;
    setHighlightCourseCode(code);
    window.setTimeout(() => setHighlightCourseCode((current) => (current === code ? null : current)), 1400);
  }

  /** Distinct professor options this layout allows for a course. */
  function swapOptionsFor(courseId: string) {
    const course = courses.find((c) => c.id === courseId);
    const ids = Array.from(
      new Set(allVariants.map((v) => optionIdFor(v, courseId)).filter((id): id is string => Boolean(id)))
    );
    return ids.map((id) => ({
      id,
      name: course?.options.find((o) => o.id === id)?.professorName ?? id
    }));
  }

  // Courses whose professor differs between combos: the only thing worth
  // printing on a combo card, since the layout is identical by definition.
  const varyingCourseIds =
    allVariants.length > 1
      ? courses
          .map((c) => c.id)
          .filter((id) => new Set(allVariants.map((v) => optionIdFor(v, id))).size > 1)
      : [];

  function comboTitle(variant: ScoredTimetable) {
    return varyingCourseIds
      .map((id) => {
        const course = courses.find((c) => c.id === id);
        return course?.options.find((o) => o.id === optionIdFor(variant, id))?.professorName;
      })
      .filter(Boolean)
      .join(" · ");
  }

  // --- Empty states ---

  if (phase !== "idle") {
    return <GeneratingFP leaving={phase === "leaving"} />;
  }

  if (generatedSchedules.length === 0) {
    if (generatedAt !== null) {
      return (
        <div className={revealed ? "t-skel-enter" : undefined}>
          <ZeroResultsFP />
        </div>
      );
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FPCard padding="lg" className="max-w-md text-center">
          <FPLabel tone="accent" variant="eyebrow">Results</FPLabel>
          <h1 className="mt-3 font-fp-display text-[22px] font-bold text-fp-text-strong">
            No schedules generated yet
          </h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-fp-text-dim">
            Add your courses and run the generator to see ranked weeks here.
          </p>
          <Link href="/planner" className="mt-5 inline-block">
            <FPButton variant="primary">Open planner</FPButton>
          </Link>
        </FPCard>
      </div>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FPCard padding="lg" className="max-w-md text-center">
          <h1 className="font-fp-display text-[length:var(--text-h)] font-bold text-fp-text-strong">
            No schedules match the current filters.
          </h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-fp-text-dim">
            Change the sort mode or regenerate schedules to bring results back into view.
          </p>
          <FPButton variant="secondary" className="mt-5" onClick={() => setSortMode("score")}>
            Reset sort
          </FPButton>
        </FPCard>
      </div>
    );
  }

  return (
    <div className={cn("-mx-4 -my-8 pb-16 sm:-mx-6 lg:-mx-8", revealed && "t-skel-enter")}>
      {/* Top nav strip */}
      <nav className="flex items-center justify-end border-b border-fp-border-default bg-fp-bg-inset px-6 py-2.5">
        <FPMetricRun
          items={[
            `${filteredGroups.length} ${filteredGroups.length === 1 ? "week" : "weeks"}`,
            `${generatedSchedules.length} professor ${generatedSchedules.length === 1 ? "option" : "options"}`,
            `generated ${formatRelativeTime(generatedAt)}`
          ]}
        />
      </nav>

      {resultsAreStale ? (
        <div className="border-b border-fp-border-default px-6 py-3">
          <FPNote tone="warn" className="flex flex-wrap items-center justify-between gap-3">
            <span>These results are over 24 hours old. Regenerate for the latest schedule.</span>
            <Link href="/planner" className="fp-text text-[length:var(--text-micro)] text-fp-warn underline">
              Redo
            </Link>
          </FPNote>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-start">
        {/* Shapes rail */}
        {/* Phone: the week itself first, other shapes after it. */}
        {/* Desktop: sticks under the 57px header and scrolls on its own, so
            switching shapes never means scrolling the whole page back up. */}
        <aside className="order-last w-full shrink-0 border-t border-fp-border-default bg-fp-bg-surface px-4 py-5 lg:sticky lg:top-[57px] lg:order-none lg:max-h-[calc(100dvh-57px)] lg:w-[212px] lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:thin] lg:border-r lg:border-t-0 lg:px-4">
          <FPLabel>Shapes · {filteredGroups.length}</FPLabel>
          <p className="mt-2 text-[length:var(--text-small)] leading-[1.4] text-fp-text-dim">
            Each one is a different week layout. Best first.
          </p>

          <motion.div
            className="mt-4 flex flex-col gap-2.5"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filteredGroups.map((group, index) => {
              const selected = group.shapeId === activeShapeGroup?.shapeId;
              const thumbnail = buildShapeThumbnail(group.representative, slots, courses);
              const isBest = index === 0;
              const label = isBest ? "Best overall" : `Shape ${index + 1}`;
              return (
                <motion.button
                  key={group.shapeId}
                  type="button"
                  variants={fadeUp}
                  onClick={() => selectShape(group.shapeId)}
                  className="text-left"
                >
                  <FPCard
                    selected={selected}
                    padding="sm"
                    className={selected ? undefined : "hover:border-fp-border-strong"}
                  >
                    {thumbnail.length > 0 ? (
                      <div className="grid grid-cols-5 gap-1">
                        {thumbnail.map((col, colIndex) =>
                          col.map((band, bandIndex) => (
                            <div
                              key={`${colIndex}-${bandIndex}`}
                              className="h-3 rounded-[2px]"
                              style={{ backgroundColor: band.color ?? "var(--bg-inset)" }}
                            />
                          ))
                        )}
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {isBest ? (
                        <FPBadge tone="accent" pill>
                          {label}
                        </FPBadge>
                      ) : (
                        <FPLabel tone={selected ? "strong" : "dim"}>{label}</FPLabel>
                      )}
                      <span className="ml-auto font-fp-mono text-[length:var(--text-body-size)] text-fp-text-strong">
                        {Math.round(group.representative.score)}
                      </span>
                    </div>
                  </FPCard>
                </motion.button>
              );
            })}

          </motion.div>

          <div className="mt-5 flex flex-col items-start gap-2.5 border-t border-fp-border-default pt-4">
            <label className="fp-text flex items-center gap-1 text-[length:var(--text-micro)] text-fp-text-dim">
              Sort
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="fp-text border-none bg-transparent text-[length:var(--text-micro)] text-fp-text-body outline-none"
              >
                <option value="score">Best first</option>
                <option value="lowGaps">Fewest gaps</option>
                <option value="earlyFinish">Earliest finish</option>
              </select>
            </label>
            <button
              type="button"
              className="fp-text inline-flex items-center gap-1 whitespace-nowrap text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-accent"
              onClick={() => {
                if (activeSchedule) addCompareSchedule(activeSchedule.id);
                router.push("/compare");
              }}
            >
              Compare {compareScheduleIds.length}
              <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-7 sm:px-7">
          {activeSchedule ? (
            <>
              <div className="flex flex-wrap items-start gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3.5">
                    <h1 className="font-fp-display text-[28px] font-bold text-fp-text-strong sm:text-[length:var(--text-display)]">
                      {activeShapeIndex === 0 ? "Best overall" : `Shape ${activeShapeIndex + 1}`}
                    </h1>
                    <span
                      className="rounded-[var(--radius-sm)] px-3 py-1.5 font-fp-mono text-[17px] text-fp-accent sm:text-[length:var(--text-h)]"
                      style={{ backgroundColor: "var(--accent-wash-strong)" }}
                    >
                      <span className="mr-1.5 text-[length:var(--text-micro)] uppercase tracking-[.14em] text-fp-text-dim">
                        score
                      </span>
                      {Math.round(displayedScore)}
                    </span>
                    {hasUnverifiedProfessor ? (
                      <FPBadge
                        tone="warn"
                        title="At least one professor here came from a student paste or import, not the official catalog. Double-check the slot in VTOP."
                      >
                        Unverified professor
                      </FPBadge>
                    ) : null}
                  </div>
                  <div className="mt-2">
                    <FPMetricRun
                      items={[
                        freeDays.length > 0
                          ? `${freeDays.map((d) => shortDay(d)).join("+")} free`
                          : "no free day",
                        `done by ${activeSchedule.metrics.latestEndTime}`,
                        `${activeSchedule.metrics.totalGapSlots} gap${activeSchedule.metrics.totalGapSlots === 1 ? "" : "s"}`,
                        "0 clash",
                        `${totalCredits} credits`
                      ]}
                    />
                  </div>
                </div>

                <div data-tour-id="results-export-share" className="ml-auto flex flex-wrap items-center gap-2.5">
                  <FPButton variant="secondary" size="sm" onClick={() => saveActive(activeSchedule)}>
                    {isSaved ? <Check className="h-3.5 w-3.5" /> : null}
                    {isSaved ? "Saved" : "Save"}
                  </FPButton>
                  <FPButton
                    variant="secondary"
                    size="sm"
                    loading={isSharing}
                    onClick={() => shareActive(activeSchedule)}
                  >
                    Share
                  </FPButton>
                  <FPButton variant="secondary" size="sm" onClick={() => setShareCardOpen(true)}>
                    Share image
                  </FPButton>
                  <div ref={exportMenuRef} className="relative">
                    <FPButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setExportMenuOpen((value) => !value)}
                    >
                      Export
                      <ChevronDown className="h-3 w-3" />
                    </FPButton>
                    {exportMenuOpen ? (
                      <div className="absolute right-0 z-20 mt-1.5 w-44 rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-1">
                        <button
                          type="button"
                          onClick={() => exportActive("png")}
                          disabled={exportingType !== null}
                          aria-busy={exportingType === "png"}
                          className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[length:var(--text-small)] text-fp-text-body hover:bg-fp-bg-raised disabled:cursor-not-allowed disabled:text-fp-text-dim"
                        >
                          PNG image
                          {exportingType === "png" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => exportActive("pdf")}
                          disabled={exportingType !== null}
                          aria-busy={exportingType === "pdf"}
                          className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[length:var(--text-small)] text-fp-text-body hover:bg-fp-bg-raised disabled:cursor-not-allowed disabled:text-fp-text-dim"
                        >
                          PDF document
                          {exportingType === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportScheduleJson(activeSchedule);
                            setExportMenuOpen(false);
                          }}
                          className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-[length:var(--text-small)] text-fp-text-body hover:bg-fp-bg-raised"
                        >
                          JSON data
                        </button>
                        <div className="px-1 py-1">
                          <IcalExportDialog schedule={activeSchedule} slots={slots} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {shareUrl ? (
                <FPNote className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="shrink-0">Share link</span>
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-[var(--radius-sm)] bg-fp-bg-inset px-2 py-1 font-fp-mono text-[length:var(--text-micro)] text-fp-text-body outline-none"
                  />
                  <FPButton
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(shareUrl).then(
                        () => toast.success("Share link copied."),
                        () => toast.error("Could not copy. Select the link and copy it manually.")
                      )
                    }
                  >
                    Copy
                  </FPButton>
                  <button
                    type="button"
                    onClick={() => setShareUrl(null)}
                    className="fp-text text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-text-body"
                  >
                    Close
                  </button>
                </FPNote>
              ) : null}

              {/* Week grid — the real FFCS slot matrix (day rows x THEORY/LAB
                  sub-rows x period columns), structurally identical to the
                  classic app's SlotMatrixTimetable. This structure is
                  non-negotiable: it's what every generated timetable in the
                  app uses, not the mockup's illustrative 5-day-column grid. */}
              <div ref={exportRef} data-tour-id="results-grid" className="mt-6">
                <FPSlotMatrixTimetable
                  schedule={activeSchedule}
                  slots={slots}
                  courses={courses}
                  onCellClick={selectCell}
                  highlightCourseCode={highlightCourseCode}
                  activeCellId={activeCellId}
                  showHeader={false}
                />
              </div>

              {/* Combos */}
              {allVariants.length > 1 ? (
                <section className="mt-7 border-t border-fp-border-default pt-6">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="font-fp-display text-[17px] font-bold text-fp-text-strong sm:text-[length:var(--text-h)]">
                      Same layout, different professors
                    </h2>
                    <FPLabel>{allVariants.length} combos · the grid above doesn&apos;t move</FPLabel>
                  </div>

                  <motion.div
                    className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {allVariants.map((variant, index) => {
                      const selected = variant.id === activeSchedule.id;
                      const notesCount = variant.selections.filter((selection) => {
                        const course = courses.find((c) => c.id === selection.courseId);
                        return Boolean(
                          course?.options.find((opt) => opt.id === selection.optionId)?.notes
                        );
                      }).length;
                      return (
                        <motion.div key={variant.id} variants={fadeUp}>
                          <FPComboCard
                            selected={selected}
                            eyebrow={`Combo ${String(index + 1).padStart(2, "0")}`}
                            score={Math.round(variant.score)}
                            title={comboTitle(variant) || `Combo ${index + 1}`}
                            meta={notesCount === 0 ? "no notes" : `${notesCount} with notes`}
                            onClick={() => selectVariant(variant.id)}
                            className="cursor-pointer"
                          />
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface">
                    <div className="flex items-center justify-between border-b border-fp-border-default px-4 py-3">
                      <FPLabel tone="strong">
                        Combo {String(activeVariantIndex + 1).padStart(2, "0")} · who you&apos;d register with
                      </FPLabel>
                      <FPMetricRun
                        items={[
                          `${activeSchedule.selections.length} courses`,
                          `${totalCredits} credits`,
                          Math.round(activeSchedule.score)
                        ]}
                      />
                    </div>
                    <FPSlotTable
                      columns={[
                        {
                          key: "course",
                          header: "Course",
                          render: (row) => (
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                              />
                              <div className="min-w-0">
                                <div className="font-fp-mono text-[length:var(--text-small)] text-fp-text-strong">
                                  {row.courseCode}
                                </div>
                                <div className="truncate text-[12px] text-fp-text-dim">
                                  {row.courseName} · {row.credits} cr
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          key: "professor",
                          header: "Professor",
                          render: (row) => {
                            const selection = activeSchedule.selections.find(
                              (s) => s.courseId === row.courseId
                            );
                            const course = courses.find((c) => c.id === row.courseId);
                            const notes = selection
                              ? course?.options.find((opt) => opt.id === selection.optionId)?.notes
                              : undefined;
                            return (
                              <div className="min-w-0">
                                <div className="truncate text-[length:var(--text-small)] text-fp-text-body">
                                  {row.professorName}
                                </div>
                                {notes ? (
                                  <div className="truncate text-[12px] text-fp-text-dim">{notes}</div>
                                ) : null}
                              </div>
                            );
                          }
                        },
                        {
                          key: "theory",
                          header: "Theory",
                          render: (row) => {
                            if (row.theorySlots.length === 0) return FP_EMPTY_CELL;
                            const { code, detail } = splitSlotGroup(row.theorySlots[0]);
                            return (
                              <div>
                                <div className="font-fp-mono text-[length:var(--text-small)] text-fp-text-body">{code}</div>
                                {detail ? (
                                  <div className="text-[12px] text-fp-text-dim">{detail}</div>
                                ) : null}
                              </div>
                            );
                          }
                        },
                        {
                          key: "lab",
                          header: "Lab",
                          render: (row) => {
                            if (row.labSlots.length === 0) return FP_EMPTY_CELL;
                            const { code, detail } = splitSlotGroup(row.labSlots[0]);
                            return (
                              <div>
                                <div className="font-fp-mono text-[length:var(--text-small)] text-fp-text-body">{code}</div>
                                {detail ? (
                                  <div className="text-[12px] text-fp-text-dim">{detail}</div>
                                ) : null}
                              </div>
                            );
                          }
                        },
                        {
                          key: "swap",
                          header: "",
                          align: "right",
                          render: (row) => {
                            const selection = activeSchedule.selections.find(
                              (s) => s.courseId === row.courseId
                            );
                            const options = swapOptionsFor(row.courseId);
                            if (!selection || options.length < 2) return null;
                            return (
                              <label className="fp-text inline-flex items-center gap-1.5 text-[length:var(--text-micro)] text-fp-text-dim">
                                Swap
                                <select
                                  aria-label={`Swap professor for ${row.courseCode}`}
                                  value={selection.optionId}
                                  onChange={(e) => swapProfessorTo(row.courseId, e.target.value)}
                                  className="max-w-[160px] cursor-pointer rounded-[var(--radius-sm)] bg-fp-bg-inset px-1.5 py-1 text-fp-text-body outline-none"
                                >
                                  {options.map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            );
                          }
                        }
                      ]}
                      rows={summaryRows}
                      rowKey={(row) => row.courseId}
                      footer={
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-fp-bg-inset px-4 py-3">
                          <span className="text-[12px] text-fp-text-dim">
                            Slot codes are what you type into VTOP on registration day.
                          </span>
                          <button
                            type="button"
                            onClick={() => copySlotList(activeSchedule)}
                            className="fp-text text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-accent"
                          >
                            Copy slot list
                          </button>
                        </div>
                      }
                    />
                  </div>
                </section>
              ) : (
                <section className="mt-7 border-t border-fp-border-default pt-6">
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface">
                    <div className="flex items-center justify-between border-b border-fp-border-default px-4 py-3">
                      <FPLabel tone="strong">Who you&apos;d register with</FPLabel>
                      <FPMetricRun
                        items={[
                          `${activeSchedule.selections.length} courses`,
                          `${totalCredits} credits`,
                          Math.round(activeSchedule.score)
                        ]}
                      />
                    </div>
                    <FPSlotTable
                      columns={[
                        {
                          key: "course",
                          header: "Course",
                          render: (row) => (
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                              />
                              <div className="min-w-0">
                                <div className="font-fp-mono text-[length:var(--text-small)] text-fp-text-strong">
                                  {row.courseCode}
                                </div>
                                <div className="truncate text-[12px] text-fp-text-dim">
                                  {row.courseName} · {row.credits} cr
                                </div>
                              </div>
                            </div>
                          )
                        },
                        { key: "professor", header: "Professor", render: (row) => row.professorName },
                        {
                          key: "theory",
                          header: "Theory",
                          render: (row) =>
                            row.theorySlots.length ? splitSlotGroup(row.theorySlots[0]).code : null
                        },
                        {
                          key: "lab",
                          header: "Lab",
                          render: (row) => (row.labSlots.length ? splitSlotGroup(row.labSlots[0]).code : null)
                        }
                      ]}
                      rows={summaryRows}
                      rowKey={(row) => row.courseId}
                      footer={
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-fp-bg-inset px-4 py-3">
                          <span className="text-[12px] text-fp-text-dim">
                            Slot codes are what you type into VTOP on registration day.
                          </span>
                          <button
                            type="button"
                            onClick={() => copySlotList(activeSchedule)}
                            className="fp-text text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-accent"
                          >
                            Copy slot list
                          </button>
                        </div>
                      }
                    />
                  </div>
                </section>
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* Bottom bar */}
      {activeSchedule ? (
        <footer data-tour-id="results-save-register" className="flex flex-wrap items-center gap-3 border-t border-fp-border-default bg-fp-bg-surface px-6 py-4">
          <FPMetricRun items={[activeSchedule.rankingMode, "constraints held"]} />
          <div className="ml-auto flex flex-wrap gap-2.5">
            <FPButton variant="ghost" size="sm" onClick={() => router.push("/planner")}>
              Relax a constraint
            </FPButton>
            <FPButton variant="primary" size="sm" onClick={() => registerWeek(activeSchedule)}>
              Save &amp; copy slots for VTOP
            </FPButton>
          </div>
        </footer>
      ) : null}

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

export default function FPResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-fp-text-dim">Loading results…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
