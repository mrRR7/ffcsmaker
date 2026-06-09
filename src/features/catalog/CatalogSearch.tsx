"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, ChevronDown, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { DBCourse, DBCourseOption, DBSemester } from "@/types/db";
import { mergeCourseOptions } from "@/features/courses/mergeCourseOptions";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

type SearchResponse = {
  courses: DBCourse[];
  semester: DBSemester | null;
  semesterId: string | null;
  error?: string;
};

type SemesterResponse = {
  semesters: DBSemester[];
  error?: string;
};

function slotLabel(slots: string[]) {
  return slots.length > 0 ? slots.join(" + ") : "None";
}

export function CatalogSearch() {
  const [query, setQuery] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [semesters, setSemesters] = useState<DBSemester[]>([]);
  const [courses, setCoursesResult] = useState<DBCourse[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const coursesInPlanner = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
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
        const response = await fetch("/api/catalog/semesters");
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
        setSemesterId((current) => current || active?.id || json.semesters?.[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof Error ? error.message : "Catalog unavailable."
          );
        }
      }
    }

    loadSemesters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2 || !semesterId) {
      setCoursesResult([]);
      setIsLoading(false);
      return;
    }

    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      setCatalogError("");
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          semester: semesterId
        });
        const response = await fetch(`/api/catalog/search?${params.toString()}`);
        const json = (await response.json()) as SearchResponse;
        if (!response.ok) {
          setCatalogError(json.error ?? "Catalog search failed.");
          setCoursesResult([]);
          return;
        }
        setCoursesResult(json.courses ?? []);
      } catch (error) {
        setCatalogError(
          error instanceof Error ? error.message : "Catalog search failed."
        );
        setCoursesResult([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, semesterId]);

  function toggleOption(optionId: string) {
    setSelectedOptions((current) => ({
      ...current,
      [optionId]: !current[optionId]
    }));
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

    toast.success(
      `${course.course_code} added with ${result.addedOptions} professor option${
        result.addedOptions === 1 ? "" : "s"
      }.`
    );
  }

  function optionRow(course: DBCourse, option: DBCourseOption) {
    const selected = Boolean(selectedOptions[option.id]);
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => toggleOption(option.id)}
        className={cn(
          "flex min-h-12 w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition",
          selected
            ? "border-primary bg-primary/10"
            : "border-border bg-background/30 hover:bg-secondary/60"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border"
          )}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {option.professor_name}
            {option.verified ? (
              <Badge className="border-primary/25 bg-primary/10 text-primary">
                Verified
              </Badge>
            ) : null}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Theory {slotLabel(option.theory_slots)} / Lab {slotLabel(option.lab_slots)}
          </span>
          {option.professor_notes ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {option.professor_notes}
            </span>
          ) : null}
        </span>
      </button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search courses, e.g. "Data Str" or "CS3"'
              className="pl-9"
            />
          </div>
          <Select
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
            className="md:max-w-xs"
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
          </Select>
        </div>

        {activeSemester ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="border-primary/25 bg-primary/10 text-primary">
              {activeSemester.label}
            </Badge>
            {activeSemester.is_active ? "Active catalog" : "Selected catalog"}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-background/30 p-3 text-sm text-muted-foreground">
            Catalog not available for this semester. Use paste, file import, or manual
            entry.
          </div>
        )}

        {catalogError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {catalogError}
          </div>
        ) : null}

        {query.trim().length < 2 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search.
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-md bg-secondary/50"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-sm text-muted-foreground">
            No courses found for "{query}". Try paste text, file import, or manual
            entry.
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const expanded = expandedCourseId === course.id;
              return (
                <div key={course.id} className="rounded-lg border border-border bg-background/30">
                  <button
                    type="button"
                    onClick={() => setExpandedCourseId(expanded ? null : course.id)}
                    className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {course.verified ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : null}
                        {course.course_code} - {course.course_name} - {course.credits}cr
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {course.course_options.length} professor option
                        {course.course_options.length === 1 ? "" : "s"} available
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </button>

                  {expanded ? (
                    <div className="space-y-3 border-t border-border p-4">
                      <div className="space-y-2">
                        {course.course_options.map((option) => optionRow(course, option))}
                      </div>
                      <Button type="button" onClick={() => addSelected(course)}>
                        Add selected options to planner
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
