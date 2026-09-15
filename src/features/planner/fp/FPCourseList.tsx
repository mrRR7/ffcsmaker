"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
import {
  getLabelsForSlotIds,
  getLabPairOptions,
  getTheoryCombinationOptions,
  SlotNameOption
} from "@/engine/slotCatalog";
import { CourseOption, TimeSlot } from "@/engine/types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { FPButton } from "@/components/fp-ui/button";
import { FPBadge } from "@/components/fp-ui/badge";
import { FPLabel } from "@/components/fp-ui/label";

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((slotId) => right.includes(slotId));
}

function toggleIds(current: string[], optionIds: string[]) {
  const active = optionIds.every((slotId) => current.includes(slotId));
  return active ? current.filter((slotId) => !optionIds.includes(slotId)) : Array.from(new Set([...current, ...optionIds]));
}

function iconButtonClass(active: boolean, tone: "accent" | "warn" | "default" = "default") {
  return cn(
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-colors",
    active
      ? tone === "warn"
        ? "border-fp-warn text-fp-warn"
        : "border-fp-border-accent text-fp-accent"
      : "border-fp-border-default text-fp-text-dim hover:border-fp-border-strong hover:text-fp-text-body"
  );
}

/**
 * FPCourseList — reskin of `src/features/courses/CourseBuilder.tsx`. Same
 * store actions, dnd-kit reordering and picker logic as the classic Manual
 * tab; only the JSX changed. Rendered below every tab (mirrors the classic
 * `StepCourses` layout, where the course list is always visible and only the
 * "add a course" form is tab-gated). Pass `showAddForm` to also render that
 * form (Manual tab only).
 */
export function FPCourseList({ showAddForm }: { showAddForm: boolean }) {
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [credits, setCredits] = useState("");
  const [collapsedCourseIds, setCollapsedCourseIds] = useState<Record<string, boolean>>({});
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const courses = useAppStore((state) => state.courses);
  const addCourse = useAppStore((state) => state.addCourse);
  const clearCourses = useAppStore((state) => state.clearCourses);

  useEffect(() => {
    if (!isDeleteAllOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsDeleteAllOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDeleteAllOpen]);

  function toggleCourseCollapse(courseId: string) {
    setCollapsedCourseIds((current) => ({ ...current, [courseId]: !current[courseId] }));
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
    addCourse({ courseCode: courseCode.trim().toUpperCase(), courseName: courseName.trim(), credits: parsedCredits });
    setCourseCode("");
    setCourseName("");
    setCredits("");
  }

  return (
    <div className="space-y-4 p-6">
      {showAddForm ? (
        <div className="rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface p-4">
          <FPLabel tone="strong" className="block text-[13px] normal-case">
            Add a course manually
          </FPLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_100px_auto]">
            <input
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              placeholder="Course code"
              className="rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-inset px-3 py-2 font-fp-mono text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
            />
            <input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="Course name"
              className="rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-inset px-3 py-2 text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
            />
            <input
              type="number"
              min={1}
              max={8}
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
              placeholder="Credits"
              className="rounded-[var(--radius-md)] border border-fp-border-strong bg-fp-bg-inset px-3 py-2 text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
            />
            <FPButton variant="primary" size="md" onClick={submitCourse}>
              <Plus className="h-4 w-4" />
              Add
            </FPButton>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <FPLabel>Your courses &middot; {courses.length}</FPLabel>
        <FPButton variant="ghost" size="sm" onClick={() => setIsDeleteAllOpen(true)} disabled={courses.length === 0}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete all
        </FPButton>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-fp-border-default bg-fp-bg-inset p-8 text-center text-[13px] text-fp-text-dim">
          No courses added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              courseId={course.id}
              index={index}
              collapsed={Boolean(collapsedCourseIds[course.id])}
              onToggleCollapse={toggleCourseCollapse}
            />
          ))}
        </div>
      )}

      {isDeleteAllOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "var(--overlay-scrim)" }}
          onClick={() => setIsDeleteAllOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[var(--radius-lg)] border border-fp-border-default bg-fp-bg-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <FPLabel tone="warn">Confirm delete</FPLabel>
            <h2 className="mt-2 font-fp-display text-[19px] font-bold text-fp-text-strong">Delete all courses?</h2>
            <p className="mt-2 text-[13px] text-fp-text-dim">
              This will remove all courses from the planner. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <FPButton variant="secondary" size="md" onClick={() => setIsDeleteAllOpen(false)}>
                Cancel
              </FPButton>
              <FPButton
                variant="primary"
                size="md"
                className="!bg-fp-danger hover:!bg-fp-danger"
                onClick={confirmDeleteAllCourses}
              >
                Delete all
              </FPButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Course card ────────────────────────────────────────────────────────────

function CourseCard({
  courseId,
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

  if (!course) return null;

  const lockedOptionCount = course.options.filter((option) =>
    constraints.professorLocks.includes(`${course.id}:${option.id}`)
  ).length;

  const avoided = constraints.avoidedFacultyByCourse[courseId] || [];
  const isRisky = course.options.length <= 1;

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
    addOption(courseId, { ...draft, professorName: draft.professorName.trim(), combinedSlotIds: [] });
    setDraft({ professorName: "", theorySlotIds: [], labSlotIds: [], combinedSlotIds: [], notes: "", program: null });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-r-[var(--radius-md)] border-y border-r bg-fp-bg-surface",
        isRisky ? "border-l-2 border-l-fp-warn border-y-fp-border-default border-r-fp-border-default" : "border-l-2 border-l-fp-accent border-y-fp-border-default border-r-fp-border-default"
      )}
      style={isRisky ? { backgroundColor: "var(--warn-wash)" } : undefined}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onToggleCollapse(course.id)}
          aria-expanded={!collapsed}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-fp-border-strong"
            style={{ backgroundColor: course.color ?? "#3fa96b" }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-fp-mono text-[13px] text-fp-text-strong">
                {course.courseCode || "Untitled course"}
              </span>
              <FPBadge>{course.credits} credits</FPBadge>
              <FPBadge>
                {course.options.length} prof{course.options.length !== 1 ? "s" : ""}
              </FPBadge>
              {lockedOptionCount > 0 ? <FPBadge tone="accent">{lockedOptionCount} locked</FPBadge> : null}
              {isRisky ? <FPLabel tone="warn">Add more &mdash; one clash and this course has nowhere to go</FPLabel> : null}
            </div>
            <p className="mt-1 truncate text-[13px] text-fp-text-dim">{course.courseName}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onToggleCollapse(course.id)}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand course" : "Collapse course"}
          className="shrink-0 text-fp-text-dim hover:text-fp-text-body"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed ? "-rotate-90" : "rotate-0")} />
        </button>
      </div>

      {!collapsed ? (
        <div className="space-y-5 border-t border-fp-border-default bg-fp-bg-surface p-4">
          {/* Course edit row */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid flex-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)_88px_56px]">
              <input
                value={course.courseCode}
                onChange={(event) => updateCourse(course.id, { courseCode: event.target.value.toUpperCase() })}
                className="rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-1.5 font-fp-mono text-[13px] text-fp-text-body focus:border-fp-border-accent focus:outline-none"
              />
              <input
                value={course.courseName}
                onChange={(event) => updateCourse(course.id, { courseName: event.target.value })}
                className="rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-1.5 text-[13px] text-fp-text-body focus:border-fp-border-accent focus:outline-none"
              />
              <input
                type="number"
                min={1}
                max={8}
                value={course.credits}
                onChange={(event) => updateCourse(course.id, { credits: Number(event.target.value) })}
                className="rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-1.5 text-[13px] text-fp-text-body focus:border-fp-border-accent focus:outline-none"
              />
              <input
                aria-label="Course color"
                type="color"
                value={course.color ?? "#3fa96b"}
                onChange={(event) => updateCourse(course.id, { color: event.target.value })}
                className="h-[34px] w-full cursor-pointer rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset p-1"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" title="Duplicate course" onClick={() => duplicateCourse(course.id)} className={iconButtonClass(false)}>
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Delete course"
                onClick={() => deleteCourse(course.id)}
                className={cn(iconButtonClass(false), "hover:border-fp-danger hover:text-fp-danger")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Professor options — drag-and-drop list */}
          {course.options.length > 0 ? (
            <div>
              <FPLabel className="mb-2 block">
                Professors <span className="normal-case text-fp-text-dim">&middot; drag to reorder preference</span>
              </FPLabel>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={course.options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {course.options.map((option, optionIndex) => {
                      const lockValue = `${course.id}:${option.id}`;
                      const locked = constraints.professorLocks.includes(lockValue);
                      const isAvoided = avoided.includes(option.id);
                      return (
                        <SortableOptionRow
                          key={option.id}
                          optionId={option.id}
                          optionIndex={optionIndex}
                          option={option}
                          locked={locked}
                          slots={slots}
                          theoryOptions={theoryOptions}
                          labOptions={labOptions}
                          avoided={isAvoided}
                          onUpdate={(patch) => updateOption(course.id, option.id, patch)}
                          onDelete={() => deleteOption(course.id, option.id)}
                          onDuplicate={() => duplicateOption(course.id, option.id)}
                          onToggleLock={() => toggleProfessorLock(course.id, option.id)}
                          onToggleAvoided={() => {
                            if (isAvoided) {
                              setAvoidedFaculty(courseId, avoided.filter((id) => id !== option.id));
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
          ) : null}

          {/* Add professor option form */}
          <div className="rounded-[var(--radius-md)] border border-dashed border-fp-border-accent p-4" style={{ backgroundColor: "var(--accent-wash)" }}>
            <div className="mb-3 flex items-center gap-2">
              <UserRoundPlus className="h-4 w-4 text-fp-accent" />
              <FPLabel tone="accent">Add professor option</FPLabel>
            </div>
            <input
              value={draft.professorName}
              placeholder="Professor name"
              onChange={(event) => setDraft((current) => ({ ...current, professorName: event.target.value }))}
              className="w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-1.5 text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
            />
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <TheoryPicker
                slots={slots}
                options={theoryOptions}
                selected={draft.theorySlotIds}
                onSelect={(slotIds) =>
                  setDraft((current) => ({
                    ...current,
                    theorySlotIds: sameIds(current.theorySlotIds, slotIds) ? [] : slotIds
                  }))
                }
              />
              <LabPicker
                options={labOptions}
                selected={draft.labSlotIds}
                onToggle={(slotIds) => setDraft((current) => ({ ...current, labSlotIds: toggleIds(current.labSlotIds, slotIds) }))}
              />
            </div>
            <textarea
              value={draft.notes}
              placeholder="Notes (optional)"
              rows={2}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              className="mt-3 w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-inset px-2.5 py-1.5 text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
            />
            <FPButton variant="primary" size="sm" className="mt-3" onClick={submitOption}>
              <Plus className="h-3.5 w-3.5" />
              Add option
            </FPButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Sortable option row ────────────────────────────────────────────────────

function SortableOptionRow({
  optionId,
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: optionId });
  const [expanded, setExpanded] = useState(false);

  const theoryLabels = getLabelsForSlotIds(slots, option.theorySlotIds);
  const labLabels = getLabelsForSlotIds(slots, option.labSlotIds);
  const summaryParts: string[] = [];
  if (theoryLabels.length > 0) summaryParts.push(`Theory ${theoryLabels.join(", ")}`);
  if (labLabels.length > 0) summaryParts.push(`Lab ${labLabels.join(", ")}`);
  const slotSummary = summaryParts.join(" · ") || "No slots";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-inset">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="-m-1.5 flex h-7 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-fp-text-dim hover:text-fp-text-body active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
          <span className="mt-0.5 shrink-0 text-fp-text-dim">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <FPLabel>#{optionIndex + 1}</FPLabel>
              <span className="truncate text-[13px] font-medium text-fp-text-body">
                {option.professorName || <span className="italic text-fp-text-dim">Unnamed</span>}
              </span>
              {locked ? <FPBadge tone="accent">Locked</FPBadge> : null}
              {avoided ? <FPBadge tone="danger">Avoided</FPBadge> : null}
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-fp-text-dim">{slotSummary}</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" title="Lock professor into generated schedules" onClick={onToggleLock} className={iconButtonClass(locked)}>
            <LockKeyhole className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={avoided ? "Stop avoiding this professor" : "Avoid this professor"}
            onClick={onToggleAvoided}
            className={iconButtonClass(avoided, "warn")}
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Duplicate option" onClick={onDuplicate} className={iconButtonClass(false)}>
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete option"
            onClick={onDelete}
            className={cn(iconButtonClass(false), "hover:border-fp-danger hover:text-fp-danger")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-fp-border-default px-3 pb-3 pt-3">
          <div className="space-y-1.5">
            <FPLabel>Professor name</FPLabel>
            <input
              value={option.professorName}
              onChange={(e) => onUpdate({ professorName: e.target.value })}
              className="w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-surface px-2.5 py-1.5 text-[13px] text-fp-text-body focus:border-fp-border-accent focus:outline-none"
            />
          </div>
          <TheoryPicker
            slots={slots}
            options={theoryOptions}
            selected={option.theorySlotIds}
            onSelect={(slotIds) => onUpdate({ theorySlotIds: sameIds(option.theorySlotIds, slotIds) ? [] : slotIds })}
          />
          <LabPicker
            options={labOptions}
            selected={option.labSlotIds}
            onToggle={(slotIds) => onUpdate({ labSlotIds: toggleIds(option.labSlotIds, slotIds) })}
          />
          {option.notes !== undefined ? (
            <textarea
              value={option.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-[var(--radius-sm)] border border-fp-border-default bg-fp-bg-surface px-2.5 py-1.5 text-[13px] text-fp-text-body placeholder:text-fp-text-dim focus:border-fp-border-accent focus:outline-none"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Theory picker ──────────────────────────────────────────────────────────

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
    <div className="rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <FPLabel>Theory</FPLabel>
        <FPBadge>{getLabelsForSlotIds(slots, selected).join(" + ") || "None"}</FPBadge>
      </div>
      <div className="max-h-48 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const active = sameIds(selected, option.slotIds);
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onSelect(option.slotIds)}
                className={cn(
                  "fp-label rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[11px] transition-colors",
                  active ? "border-fp-border-accent text-fp-accent" : "border-fp-border-default text-fp-text-dim hover:text-fp-text-body"
                )}
                style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
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

// ─── Lab picker ─────────────────────────────────────────────────────────────

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
    <div className="rounded-[var(--radius-md)] border border-fp-border-default bg-fp-bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <FPLabel>Lab</FPLabel>
        <FPBadge>{selected.length}</FPBadge>
      </div>
      <div className="max-h-48 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const active = option.slotIds.every((slotId) => selected.includes(slotId));
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onToggle(option.slotIds)}
                className={cn(
                  "fp-label rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[11px] transition-colors",
                  active ? "border-fp-border-accent text-fp-accent" : "border-fp-border-default text-fp-text-dim hover:text-fp-text-body"
                )}
                style={active ? { backgroundColor: "var(--accent-wash)" } : undefined}
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
