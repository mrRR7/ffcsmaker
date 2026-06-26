"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { staggerContainer, fadeUp } from "@/utils/motion";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  LockKeyhole,
  Plus,
  Trash2,
  UserRoundPlus,
  XCircle
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
  const [collapsedCourseIds, setCollapsedCourseIds] = useState<Record<string, boolean>>(
    {}
  );
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const courses = useAppStore((state) => state.courses);
  const addCourse = useAppStore((state) => state.addCourse);
  const clearCourses = useAppStore((state) => state.clearCourses);

  useEffect(() => {
    if (!isDeleteAllOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDeleteAllOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDeleteAllOpen]);

  function toggleCourseCollapse(courseId: string) {
    setCollapsedCourseIds((current) => ({
      ...current,
      [courseId]: !current[courseId]
    }));
  }

  function confirmDeleteAllCourses() {
    clearCourses();
    setCollapsedCourseIds({});
    setIsDeleteAllOpen(false);
    toast.success("All courses cleared.");
  }

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

      <Card className="h-fit">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              Collapse individual courses to scan the list, or clear the planner&apos;s
              course data in one step.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDeleteAllOpen(true)}
            disabled={courses.length === 0}
            className="border-border text-muted-foreground hover:text-foreground shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-muted-foreground">
              No courses added yet.
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
              {courses.map((course, index) => (
                <motion.div key={course.id} variants={fadeUp} layout="position">
                  <CourseCard
                    courseId={course.id}
                    index={index}
                    collapsed={Boolean(collapsedCourseIds[course.id])}
                    onToggleCollapse={toggleCourseCollapse}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isDeleteAllOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteAllOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-all-courses-title"
              aria-describedby="delete-all-courses-description"
              className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ duration: 0.16 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Confirm delete
                </p>
                <h2 id="delete-all-courses-title" className="text-xl font-semibold">
                  Delete all courses?
                </h2>
                <p
                  id="delete-all-courses-description"
                  className="text-sm text-muted-foreground"
                >
                  This will remove all courses from the planner. This cannot be
                  undone.
                </p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDeleteAllOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDeleteAllCourses}>
                  Delete All
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Sortable option row wrapper ─────────────────────────────────────────────

function SortableOptionRow({
  optionId,
  courseId,
  optionIndex,
  option,
  locked,
  slots,
  theoryOptions,
  labOptions,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleLock,
  onToggleAvoided,
  avoided
}: {
  optionId: string;
  courseId: string;
  optionIndex: number;
  option: CourseOption;
  locked: boolean;
  slots: TimeSlot[];
  theoryOptions: SlotNameOption[];
  labOptions: SlotNameOption[];
  onUpdate: (patch: Partial<CourseOption>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onToggleAvoided: () => void;
  avoided: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: optionId });

  const [expanded, setExpanded] = useState(false);

  const theoryLabels = getLabelsForSlotIds(slots, option.theorySlotIds);
  const labLabels = getLabelsForSlotIds(slots, option.labSlotIds);

  const summaryParts: string[] = [];
  if (theoryLabels.length > 0) summaryParts.push(`Theory: ${theoryLabels.join(", ")}`);
  if (labLabels.length > 0) summaryParts.push(`Lab: ${labLabels.join(", ")}`);
  const slotSummary = summaryParts.join(" · ") || "No slots";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-border bg-background/35"
    >
      {/* ── Compact summary row ── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Summary text */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <span className="mt-0.5 shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground">
                #{optionIndex + 1}
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {option.professorName || <span className="italic text-muted-foreground">Unnamed</span>}
              </span>
              {locked && (
                <span className="inline-flex items-center gap-0.5 rounded-sm border border-primary/25 bg-primary/10 px-1 py-0.5 text-[10px] font-semibold text-primary">
                  Locked
                </span>
              )}
              {avoided && (
                <span className="inline-flex items-center gap-0.5 rounded-sm border border-destructive/30 bg-destructive/10 px-1 py-0.5 text-[10px] font-semibold text-destructive">
                  Avoided
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {slotSummary}
            </span>
          </span>
        </button>

        {/* Action buttons — always visible */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant={locked ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            title="Lock professor into generated schedules"
            onClick={onToggleLock}
          >
            <LockKeyhole className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={avoided ? "destructive" : "ghost"}
            size="icon"
            className="h-7 w-7"
            title={avoided ? "Stop avoiding this professor" : "Avoid this professor"}
            onClick={onToggleAvoided}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Duplicate option"
            onClick={onDuplicate}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Delete option"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Expanded detail section ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-3 pb-3 pt-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Professor Name</Label>
                <Input
                  value={option.professorName}
                  onChange={(e) => onUpdate({ professorName: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <TheoryPicker
                slots={slots}
                options={theoryOptions}
                selected={option.theorySlotIds}
                onSelect={(slotIds) =>
                  onUpdate({
                    theorySlotIds: sameIds(option.theorySlotIds, slotIds) ? [] : slotIds
                  })
                }
              />
              <LabPicker
                options={labOptions}
                selected={option.labSlotIds}
                onToggle={(slotIds) =>
                  onUpdate({ labSlotIds: toggleIds(option.labSlotIds, slotIds) })
                }
              />
              {option.notes !== undefined && (
                <Textarea
                  value={option.notes}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  className="text-sm"
                  placeholder="Notes (optional)"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  courseId,
  index,
  collapsed,
  onToggleCollapse
}: {
  courseId: string;
  index: number;
  collapsed: boolean;
  onToggleCollapse: (courseId: string) => void;
}) {
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
  const toggleProfessorLock = useAppStore((state) => state.toggleProfessorLock);
  const setAvoidedFaculty = useAppStore((state) => state.setAvoidedFaculty);
  const reorderOptions = useAppStore((state) => state.reorderOptions);
  const course = courses.find((item) => item.id === courseId);
  const theoryOptions = useMemo(() => getTheoryCombinationOptions(slots), [slots]);
  const labOptions = useMemo(() => getLabPairOptions(slots), [slots]);
  const [draft, setDraft] = useState<Omit<CourseOption, "id">>({
    professorName: "",
    theorySlotIds: [],
    labSlotIds: [],
    combinedSlotIds: [],
    notes: "",
    program: null
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!course) {
    return null;
  }

  const lockedOptionCount = course.options.filter((option) =>
    constraints.professorLocks.includes(`${course.id}:${option.id}`)
  ).length;

  const avoided = constraints.avoidedFacultyByCourse[courseId] || [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = course!.options.findIndex((o) => o.id === active.id);
    const newIndex = course!.options.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...course!.options.map((o) => o.id)];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    reorderOptions(courseId, newOrder);
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
      notes: "",
      program: null
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleCollapse(course.id)}
            aria-expanded={!collapsed}
            className="flex flex-1 items-start gap-3 rounded-lg text-left transition hover:bg-secondary/40"
          >
            <span
              className="mt-1.5 h-3 w-3 shrink-0 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: course.color ?? "#14b8a6" }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold tracking-normal sm:text-lg">
                  {course.courseCode || "Untitled course"}
                </p>
                <Badge>{course.credits} credits</Badge>
                <Badge>{course.options.length} prof{course.options.length !== 1 ? "s" : ""}</Badge>
                {lockedOptionCount > 0 ? (
                  <Badge className="border-primary/25 bg-primary/10 text-primary">
                    {lockedOptionCount} locked
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {course.courseName}
              </p>
            </div>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={collapsed ? "Expand course" : "Collapse course"}
            aria-expanded={!collapsed}
            onClick={() => onToggleCollapse(course.id)}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed ? "-rotate-90" : "rotate-0"
              )}
            />
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="course-content"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <CardContent className="space-y-5">
              {/* Course edit row */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)_96px_64px]">
                  <Input
                    value={course.courseCode}
                    onChange={(event) =>
                      updateCourse(course.id, {
                        courseCode: event.target.value.toUpperCase()
                      })
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
                    onChange={(event) =>
                      updateCourse(course.id, { color: event.target.value })
                    }
                    className="h-10 w-full cursor-pointer rounded-md border border-border bg-background p-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Duplicate course"
                    onClick={() => duplicateCourse(course.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    title="Delete course"
                    onClick={() => deleteCourse(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Professor options — drag-and-drop list */}
              {course.options.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Professors
                    <span className="ml-2 font-normal normal-case text-muted-foreground/60">
                      drag to reorder preference
                    </span>
                  </p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={course.options.map((o) => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {course.options.map((option, optionIndex) => {
                          const lockValue = `${course.id}:${option.id}`;
                          const locked = constraints.professorLocks.includes(lockValue);
                          const isAvoided = avoided.includes(option.id);
                          return (
                            <SortableOptionRow
                              key={option.id}
                              optionId={option.id}
                              courseId={course.id}
                              optionIndex={optionIndex}
                              option={option}
                              locked={locked}
                              slots={slots}
                              theoryOptions={theoryOptions}
                              labOptions={labOptions}
                              avoided={isAvoided}
                              onUpdate={(patch) =>
                                updateOption(course.id, option.id, patch)
                              }
                              onDelete={() => deleteOption(course.id, option.id)}
                              onDuplicate={() => duplicateOption(course.id, option.id)}
                              onToggleLock={() =>
                                toggleProfessorLock(course.id, option.id)
                              }
                              onToggleAvoided={() => {
                                if (isAvoided) {
                                  setAvoidedFaculty(
                                    courseId,
                                    avoided.filter((id) => id !== option.id)
                                  );
                                } else {
                                  setAvoidedFaculty(courseId, [...avoided, option.id]);
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Add professor option form */}
              <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserRoundPlus className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Add Professor Option</p>
                </div>
                <Input
                  value={draft.professorName}
                  placeholder="Professor name"
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
                  placeholder="Notes (optional)"
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

// ─── Theory Picker ────────────────────────────────────────────────────────────

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
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
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

// ─── Lab Picker ───────────────────────────────────────────────────────────────

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
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-hairline bg-transparent text-muted-soft hover:bg-surface-soft hover:text-ink"
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
