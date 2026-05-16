"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  LockKeyhole,
  Plus,
  Trash2,
  UserRoundPlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/form";
import {
  getLabelsForSlotIds,
  getLabPairOptions,
  getTheoryCombinationOptions,
  SlotNameOption
} from "@/engine/slotCatalog";
import { CourseOption, TimeSlot } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

function sameIds(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((slotId) => right.includes(slotId))
  );
}

function toggleIds(current: string[], optionIds: string[]) {
  const active = optionIds.every((slotId) => current.includes(slotId));
  return active
    ? current.filter((slotId) => !optionIds.includes(slotId))
    : Array.from(new Set([...current, ...optionIds]));
}

export function CourseBuilder() {
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [credits, setCredits] = useState("");
  const courses = useAppStore((state) => state.courses);
  const addCourse = useAppStore((state) => state.addCourse);

  function submitCourse() {
    const parsedCredits = Number(credits);
    if (!courseCode.trim() || !courseName.trim() || parsedCredits <= 0) {
      toast.error("Course code, name, and credits are required.");
      return;
    }
    addCourse({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      credits: parsedCredits
    });
    setCourseCode("");
    setCourseName("");
    setCredits("");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Course Builder</CardTitle>
          <CardDescription>
            Add courses, then add professor options with one theory combination and
            paired lab slots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Course Code</Label>
            <Input
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Course Name</Label>
            <Input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Credits</Label>
            <Input
              type="number"
              min={1}
              max={8}
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
            />
          </div>
          <Button type="button" className="w-full" onClick={submitCourse}>
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {courses.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No courses added yet.
          </Card>
        ) : (
          courses.map((course, index) => (
            <CourseCard key={course.id} courseId={course.id} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function CourseCard({ courseId, index }: { courseId: string; index: number }) {
  const courses = useAppStore((state) => state.courses);
  const slots = useAppStore((state) => state.slots);
  const constraints = useAppStore((state) => state.constraints);
  const updateCourse = useAppStore((state) => state.updateCourse);
  const deleteCourse = useAppStore((state) => state.deleteCourse);
  const duplicateCourse = useAppStore((state) => state.duplicateCourse);
  const moveCourse = useAppStore((state) => state.moveCourse);
  const addOption = useAppStore((state) => state.addOption);
  const updateOption = useAppStore((state) => state.updateOption);
  const deleteOption = useAppStore((state) => state.deleteOption);
  const duplicateOption = useAppStore((state) => state.duplicateOption);
  const moveOption = useAppStore((state) => state.moveOption);
  const toggleProfessorLock = useAppStore((state) => state.toggleProfessorLock);
  const course = courses.find((item) => item.id === courseId);
  const theoryOptions = useMemo(() => getTheoryCombinationOptions(slots), [slots]);
  const labOptions = useMemo(() => getLabPairOptions(slots), [slots]);
  const [draft, setDraft] = useState<Omit<CourseOption, "id">>({
    professorName: "",
    theorySlotIds: [],
    labSlotIds: [],
    combinedSlotIds: [],
    notes: ""
  });

  if (!course) {
    return null;
  }

  function submitOption() {
    if (!draft.professorName.trim()) {
      toast.error("Professor name is required.");
      return;
    }
    if (draft.theorySlotIds.length === 0 && draft.labSlotIds.length === 0) {
      toast.error("Select theory or lab slots for the professor.");
      return;
    }
    addOption(courseId, {
      ...draft,
      professorName: draft.professorName.trim(),
      combinedSlotIds: []
    });
    setDraft({
      professorName: "",
      theorySlotIds: [],
      labSlotIds: [],
      combinedSlotIds: [],
      notes: ""
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)_96px_64px]">
            <Input
              value={course.courseCode}
              onChange={(event) =>
                updateCourse(course.id, { courseCode: event.target.value.toUpperCase() })
              }
            />
            <Input
              value={course.courseName}
              onChange={(event) =>
                updateCourse(course.id, { courseName: event.target.value })
              }
            />
            <Input
              type="number"
              min={1}
              max={8}
              value={course.credits}
              onChange={(event) =>
                updateCourse(course.id, { credits: Number(event.target.value) })
              }
            />
            <input
              aria-label="Course color"
              type="color"
              value={course.color ?? "#14b8a6"}
              onChange={(event) => updateCourse(course.id, { color: event.target.value })}
              className="h-10 w-full cursor-pointer rounded-md border border-border bg-background p-1"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="icon" title="Move up" onClick={() => moveCourse(course.id, "up")}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" title="Move down" onClick={() => moveCourse(course.id, "down")}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" title="Duplicate course" onClick={() => duplicateCourse(course.id)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button type="button" variant="destructive" size="icon" title="Delete course" onClick={() => deleteCourse(course.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{course.options.length} professors</Badge>
          <Badge>{course.credits} credits</Badge>
          <Badge>Priority {index + 1}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 lg:grid-cols-2">
          {course.options.map((option, optionIndex) => {
            const lockValue = `${course.id}:${option.id}`;
            const locked = constraints.professorLocks.includes(lockValue);
            return (
              <div
                key={option.id}
                className="rounded-md border border-border bg-background/35 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <Label>Professor</Label>
                    <Input
                      value={option.professorName}
                      onChange={(event) =>
                        updateOption(course.id, option.id, {
                          professorName: event.target.value
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={locked ? "default" : "outline"}
                      size="icon"
                      title="Lock professor into generated schedules"
                      onClick={() => toggleProfessorLock(course.id, option.id)}
                    >
                      <LockKeyhole className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" title="Move option up" onClick={() => moveOption(course.id, option.id, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" title="Move option down" onClick={() => moveOption(course.id, option.id, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" title="Duplicate option" onClick={() => duplicateOption(course.id, option.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="destructive" size="icon" title="Delete option" onClick={() => deleteOption(course.id, option.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>Option {optionIndex + 1}</Badge>
                  {locked ? <Badge className="border-primary/25 bg-primary/10 text-primary">Locked</Badge> : null}
                  {getLabelsForSlotIds(slots, option.theorySlotIds).map((label) => (
                    <Badge key={label}>Theory {label}</Badge>
                  ))}
                  {getLabelsForSlotIds(slots, option.labSlotIds).map((label) => (
                    <Badge key={label}>Lab {label}</Badge>
                  ))}
                </div>
                <div className="mt-3 space-y-3">
                  <TheoryPicker
                    slots={slots}
                    options={theoryOptions}
                    selected={option.theorySlotIds}
                    onSelect={(slotIds) =>
                      updateOption(course.id, option.id, {
                        theorySlotIds: sameIds(option.theorySlotIds, slotIds)
                          ? []
                          : slotIds
                      })
                    }
                  />
                  <LabPicker
                    options={labOptions}
                    selected={option.labSlotIds}
                    onToggle={(slotIds) =>
                      updateOption(course.id, option.id, {
                        labSlotIds: toggleIds(option.labSlotIds, slotIds)
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserRoundPlus className="h-4 w-4 text-primary" />
            <p className="font-semibold">Add Professor Option</p>
          </div>
          <Input
            value={draft.professorName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                professorName: event.target.value
              }))
            }
          />
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <TheoryPicker
              slots={slots}
              options={theoryOptions}
              selected={draft.theorySlotIds}
              onSelect={(slotIds) =>
                setDraft((current) => ({
                  ...current,
                  theorySlotIds: sameIds(current.theorySlotIds, slotIds)
                    ? []
                    : slotIds
                }))
              }
            />
            <LabPicker
              options={labOptions}
              selected={draft.labSlotIds}
              onToggle={(slotIds) =>
                setDraft((current) => ({
                  ...current,
                  labSlotIds: toggleIds(current.labSlotIds, slotIds)
                }))
              }
            />
          </div>
          <Textarea
            className="mt-3"
            value={draft.notes}
            onChange={(event) =>
              setDraft((current) => ({ ...current, notes: event.target.value }))
            }
          />
          <Button type="button" className="mt-3" onClick={submitOption}>
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TheoryPicker({
  slots,
  options,
  selected,
  onSelect
}: {
  slots: TimeSlot[];
  options: SlotNameOption[];
  selected: string[];
  onSelect: (slotIds: string[]) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>Theory</Label>
        <Badge>{getLabelsForSlotIds(slots, selected).join(" + ") || "None"}</Badge>
      </div>
      <div className="max-h-56 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const active = sameIds(selected, option.slotIds);
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onSelect(option.slotIds)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LabPicker({
  options,
  selected,
  onToggle
}: {
  options: SlotNameOption[];
  selected: string[];
  onToggle: (slotIds: string[]) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>Lab</Label>
        <Badge>{selected.length}</Badge>
      </div>
      <div className="max-h-56 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const active = option.slotIds.every((slotId) => selected.includes(slotId));
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onToggle(option.slotIds)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
