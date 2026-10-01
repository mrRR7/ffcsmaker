"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { DBCourse, DBCourseOption, DBSemester } from "@/types/db";
import { mergeCourseOptions } from "@/features/courses/mergeCourseOptions";
import { loadCatalog } from "@/lib/catalogCache";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPLabel } from "@/components/fp-ui/label";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPNote } from "@/components/fp-ui/note";
import { FPCheckbox } from "@/components/fp-ui/checkbox";
import { FPMetricRun } from "@/components/fp-ui/metric-run";
import {
  FPSlotOptionChip,
  FPTimeOfDayToggle,
  groupOptionsBySlot,
  slotLabel,
  TimeOfDayFilter
} from "@/features/planner/fp/FPCourseOptionGroups";

const SEARCH_RESULTS_CAP = 10;

type SemesterResponse = {
  semesters: DBSemester[];
  error?: string;
};

/**
 * FPSearchTab — reskin of `src/features/catalog/CatalogSearch.tsx`. Same
 * state, effects, debounce, caching, and `mergeCourseOptions` call; only the
 * markup changed to fp-ui primitives per the "Search catalog" mockup.
 */
export function FPSearchTab() {
  const [query, setQuery] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [semesters, setSemesters] = useState<DBSemester[]>([]);
  const [allCourses, setAllCourses] = useState<DBCourse[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [timeFilterByCourse, setTimeFilterByCourse] = useState<Record<string, TimeOfDayFilter>>({});
  const [expandedGroupByCourse, setExpandedGroupByCourse] = useState<Record<string, string | null>>({});
  const [showAllResults, setShowAllResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  // Split theory/lab codes (BCSE204L / BCSE204P) are separate courses; nudge to add the lab.
  const [labHint, setLabHint] = useState<DBCourse | null>(null);

  const coursesInPlanner = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const campus = useAppStore((state) => state.campus) ?? "chennai";
  const setCourses = useAppStore((state) => state.setCourses);

  const activeSemester = useMemo(() => {
    return (
      semesters.find((semester) => semester.id === semesterId) ??
      semesters.find((semester) => semester.is_active) ??
      null
    );
  }, [semesterId, semesters]);

  useEffect(() => {
    let cancelled = false;

    async function loadSemesters() {
      try {
        const response = await fetch(`/api/catalog/semesters?campus=${campus}`);
        const json = (await response.json()) as SemesterResponse;
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          setCatalogError(json.error ?? "Catalog unavailable.");
          return;
        }
        setSemesters(json.semesters ?? []);
        const active = json.semesters?.find((semester) => semester.is_active);
        setSemesterId(active?.id || json.semesters?.[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : "Catalog unavailable.");
        }
      }
    }

    loadSemesters();
    return () => {
      cancelled = true;
    };
  }, [campus]);

  useEffect(() => {
    setShowAllResults(false);
  }, [query]);

  // Fetch the whole campus/semester catalog once (cached — see
  // src/lib/catalogCache.ts) and filter client-side per keystroke.
  useEffect(() => {
    if (!semesterId) {
      setAllCourses([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setCatalogError("");

    loadCatalog(campus, semesterId)
      .then((entry) => {
        if (!cancelled) setAllCourses(entry.courses);
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalogError(error instanceof Error ? error.message : "Catalog search failed.");
        setAllCourses([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [semesterId, campus]);

  const courses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) {
      return [];
    }
    return allCourses.filter(
      (course) =>
        course.course_code.toLowerCase().startsWith(needle) ||
        course.course_name.toLowerCase().includes(needle)
    );
  }, [allCourses, query]);

  function toggleOption(optionId: string) {
    setSelectedOptions((current) => ({ ...current, [optionId]: !current[optionId] }));
  }

  /** Tick every option in the list, or untick them all if they're already ticked. */
  function toggleAll(options: DBCourseOption[]) {
    setSelectedOptions((current) => {
      const allTicked = options.every((option) => current[option.id]);
      const next = { ...current };
      options.forEach((option) => (next[option.id] = !allTicked));
      return next;
    });
  }

  function addSelected(course: DBCourse) {
    const selected = course.course_options.filter((option) => selectedOptions[option.id]);
    if (selected.length === 0) {
      toast.error("Select at least one professor option.");
      return;
    }

    const result = mergeCourseOptions(
      coursesInPlanner,
      selected.map((option) => ({
        courseCode: course.course_code,
        courseName: course.course_name,
        credits: course.credits,
        professorName: option.professor_name,
        program: option.program,
        theorySlotsRaw: option.theory_slots.join(", "),
        labSlotsRaw: option.lab_slots.join(", "),
        notes: option.professor_notes ?? ""
      })),
      slots
    );

    setCourses(result.courses);
    setSelectedOptions((current) => {
      const next = { ...current };
      selected.forEach((option) => delete next[option.id]);
      return next;
    });

    setExpandedCourseId(null);
    const code = course.course_code;
    const lab = code.endsWith("L")
      ? allCourses.find((c) => c.course_code === `${code.slice(0, -1)}P`)
      : undefined;
    setLabHint(lab && !result.courses.some((c) => c.courseCode === lab.course_code) ? lab : null);
    toast.success(`${course.course_code} added with ${result.addedOptions} professor option${result.addedOptions === 1 ? "" : "s"}.`);
  }

  function optionRow(course: DBCourse, option: DBCourseOption) {
    const selected = Boolean(selectedOptions[option.id]);
    return (
      <div
        key={option.id}
        role="button"
        tabIndex={0}
        onClick={() => toggleOption(option.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleOption(option.id);
          }
        }}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-[14px] py-[11px] text-left transition-colors",
          selected ? "border-fp-border-accent" : "border-fp-border-default hover:bg-fp-bg-raised"
        )}
        style={selected ? { backgroundColor: "var(--accent-wash)" } : undefined}
      >
        <FPCheckbox checked={selected} />
        <span className="min-w-0 flex-1">
          <span className={cn("flex flex-wrap items-center gap-2 text-[length:var(--text-small)]", selected ? "text-fp-text-strong" : "text-fp-text-body")}>
            {option.professor_name}
            {option.program ? <FPLabel>{option.program}</FPLabel> : null}
            {!option.verified ? <FPLabel tone="warn">Unverified</FPLabel> : null}
          </span>
          {option.professor_notes ? (
            <span className="mt-0.5 block text-[12px] text-fp-text-dim">{option.professor_notes}</span>
          ) : null}
        </span>
        <FPLabel className="shrink-0">
          {slotLabel(option.theory_slots)} &middot; {slotLabel(option.lab_slots)}
        </FPLabel>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-1 items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent bg-fp-bg-inset px-[14px] py-[11px] focus-within:border-[var(--border-selected)]">
          <span className="font-fp-mono text-fp-text-dim">/</span>
          <input
            aria-label="Search courses by code or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Course code or name"
            className="w-full bg-transparent text-[length:var(--text-small)] text-fp-text-body placeholder:text-fp-text-dim focus:outline-none"
          />
        </div>
        <select
          value={semesterId}
          onChange={(event) => setSemesterId(event.target.value)}
          className="fp-text rounded-[var(--radius-md)] border border-transparent bg-fp-bg-inset px-3 py-[11px] text-[length:var(--text-micro)] text-fp-text-dim focus:border-[var(--border-selected)] focus:outline-none"
        >
          {semesters.length === 0 ? (
            <option value="">No semester</option>
          ) : (
            semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.label}
                {semester.is_active ? " (active)" : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {activeSemester ? (
        <FPMetricRun
          items={[
            <FPBadge tone="neutral" key="sem">
              {activeSemester.label}
            </FPBadge>,
            activeSemester.is_active ? "Active catalog" : "Selected catalog"
          ]}
        />
      ) : (
        <FPNote>Catalog not available for this semester. Use paste, file import, or manual entry.</FPNote>
      )}

      {catalogError ? <FPNote tone="warn">{catalogError}</FPNote> : null}

      {labHint && !coursesInPlanner.some((c) => c.courseCode === labHint.course_code) ? (
        <FPNote className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            <span className="font-fp-mono text-fp-text-body">{labHint.course_code}</span> (lab) is a separate course. Add it too?
          </span>
          <button
            type="button"
            onClick={() => {
              setQuery(labHint.course_code);
              setExpandedCourseId(labHint.id);
            }}
            className="text-fp-accent underline underline-offset-[3px]"
          >
            Show lab professors
          </button>
          <button
            type="button"
            onClick={() => setLabHint(null)}
            className="text-fp-text-dim underline underline-offset-[3px] hover:text-fp-text-body"
          >
            Skip
          </button>
        </FPNote>
      ) : null}

      {query.trim().length < 2 ? (
        <div className="p-8 text-center text-[length:var(--text-small)] text-fp-text-dim">
          Type at least 2 characters to search.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-fp-bg-inset" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 text-center text-[length:var(--text-small)] text-fp-text-dim">
          No courses found for &quot;{query}&quot;. Try paste text, file import, or manual entry.
        </div>
      ) : (
        <div className="space-y-3">
          {(showAllResults ? courses : courses.slice(0, SEARCH_RESULTS_CAP)).map((course) => {
            const expanded = expandedCourseId === course.id;
            const tickedCount = course.course_options.filter((option) => selectedOptions[option.id]).length;
            const timeFilter = timeFilterByCourse[course.id] ?? "all";
            const groups = groupOptionsBySlot(course.course_options, slots);
            const visibleGroups = groups.filter(
              (group) => timeFilter === "all" || group.timeOfDay === "unscheduled" || group.timeOfDay === timeFilter
            );
            const expandedGroupKey = expandedGroupByCourse[course.id] ?? null;
            const inPlan = coursesInPlanner.find((c) => c.courseCode === course.course_code);
            const inPlanCount = inPlan?.options.length ?? 0;
            const visibleOptions = visibleGroups.flatMap((group) => group.options);
            return (
              <div
                key={course.id}
                className={cn(
                  "overflow-hidden rounded-[var(--radius-md)] border bg-fp-bg-surface",
                  tickedCount > 0 ? "border-fp-border-accent" : "border-fp-border-default"
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedCourseId(expanded ? null : course.id)}
                  className="flex w-full items-center gap-3 border-b border-fp-border-default px-4 py-[14px] text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-fp-mono text-[length:var(--text-small)] text-fp-text-strong">
                      {course.verified ? <ShieldCheck className="h-3.5 w-3.5 text-fp-accent" /> : null}
                      {course.course_code}
                    </div>
                    <div className="mt-0.5 truncate text-[length:var(--text-small)] text-fp-text-dim">
                      {course.course_name} &middot; {course.credits} credit{course.credits === 1 ? "" : "s"} &middot; {course.course_options.length} professor
                      {course.course_options.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  {tickedCount > 0 ? (
                    <FPLabel tone="accent" className="shrink-0">
                      {tickedCount} ticked
                    </FPLabel>
                  ) : inPlanCount > 0 ? (
                    <FPBadge tone="accent" pill className="shrink-0 items-center gap-1.5">
                      <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: inPlan?.color ?? "var(--accent)" }} />
                      In plan · {inPlanCount} prof{inPlanCount === 1 ? "" : "s"}
                    </FPBadge>
                  ) : null}
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-fp-text-dim transition-transform", expanded && "rotate-180")} />
                </button>

                {expanded ? (
                  <div className="space-y-3 p-4">
                    {groups.length > 1 ? (
                      <FPTimeOfDayToggle
                        value={timeFilter}
                        onChange={(value) => setTimeFilterByCourse((current) => ({ ...current, [course.id]: value }))}
                      />
                    ) : null}

                    <div className="space-y-2">
                      {visibleGroups.map((group) => {
                        const groupExpanded = groups.length === 1 || expandedGroupKey === group.slotKey;
                        const hasTicked = group.options.some((option) => selectedOptions[option.id]);
                        return (
                          <FPSlotOptionChip
                            key={group.slotKey}
                            theoryLabel={group.theoryLabel}
                            count={group.options.length}
                            hasTicked={hasTicked}
                            expanded={groupExpanded}
                            onToggle={() =>
                              setExpandedGroupByCourse((current) => ({
                                ...current,
                                [course.id]: current[course.id] === group.slotKey ? null : group.slotKey
                              }))
                            }
                          >
                            {group.options.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => toggleAll(group.options)}
                                className="fp-text text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-accent"
                              >
                                {group.options.every((option) => selectedOptions[option.id])
                                  ? "Untick all in this slot"
                                  : `Tick all ${group.options.length} in this slot`}
                              </button>
                            ) : null}
                            {group.options.map((option) => optionRow(course, option))}
                          </FPSlotOptionChip>
                        );
                      })}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <FPButton
                        variant="primary"
                        size="sm"
                        onClick={() => addSelected(course)}
                        disabled={tickedCount === 0}
                      >
                        {tickedCount > 0 ? `Add ${tickedCount} professor${tickedCount === 1 ? "" : "s"}` : "Tick professors to add"}
                      </FPButton>
                      {visibleOptions.length > 1 ? (
                        <FPButton variant="ghost" size="sm" onClick={() => toggleAll(visibleOptions)}>
                          {visibleOptions.every((option) => selectedOptions[option.id])
                            ? "Untick all"
                            : `Tick all ${visibleOptions.length}`}
                        </FPButton>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          {!showAllResults && courses.length > SEARCH_RESULTS_CAP ? (
            <button
              type="button"
              onClick={() => setShowAllResults(true)}
              className="fp-text w-full rounded-[var(--radius-md)] border border-dashed border-fp-border-strong px-4 py-3 text-center text-[length:var(--text-micro)] text-fp-text-dim hover:text-fp-text-body"
            >
              {courses.length - SEARCH_RESULTS_CAP} more result{courses.length - SEARCH_RESULTS_CAP === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
