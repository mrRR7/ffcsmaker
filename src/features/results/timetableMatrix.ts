import { Course, ScoredTimetable, TimeSlot, TimetableSelection } from "@/engine/types";
import { DayOfWeek, DAYS } from "@/engine/types";
import { formatMinutes, parseTime } from "@/engine/conflict";

export type MatrixTrack = "THEORY" | "LAB";

export type MatrixColumn = {
  kind: "slot" | "lunch";
  track: MatrixTrack;
  slotIndex?: number;
  partIndex?: number;
  slotLabel?: string;
  startTime?: string;
  endTime?: string;
};

export type MatrixCell = {
  id: string;
  day: DayOfWeek;
  track: MatrixTrack;
  slot: TimeSlot | null;
  occupied: boolean;
  slotLabel: string;
  startTime: string;
  endTime: string;
  slotIds: string[];
  courseId: string | null;
  courseCode: string | null;
  courseName: string | null;
  professorName: string | null;
  credits: number | null;
  color: string;
  typeLabel: "Theory" | "Lab" | "Both" | null;
  notes?: string;
  selection?: TimetableSelection;
};

export type CourseSummaryRow = {
  courseId: string;
  courseCode: string;
  courseName: string;
  professorName: string;
  credits: number;
  typeLabel: "Theory" | "Lab" | "Both";
  theorySlots: string[];
  labSlots: string[];
  slotIds: string[];
  color: string;
  notes?: string;
};

function sortSlots(slots: TimeSlot[]) {
  return [...slots].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
}

function getDaySlots(slots: TimeSlot[], day: DayOfWeek, kind: "theory" | "lab") {
  return sortSlots(slots.filter((slot) => slot.day === day && slot.kind === kind));
}

function buildColumns(slots: TimeSlot[], kind: "theory" | "lab"): MatrixColumn[] {
  const templateDay = DAYS[0];
  const templateSlots = getDaySlots(slots, templateDay, kind);
  const morning = templateSlots.slice(0, 6);
  const afternoon = templateSlots.slice(6, 12);

  return [
    ...morning.map((slot, slotIndex) => ({
      kind: "slot" as const,
      track: (kind === "theory" ? "THEORY" : "LAB") as MatrixTrack,
      slotIndex,
      slotLabel: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime
    })),
    {
      kind: "lunch" as const,
      track: kind === "theory" ? "THEORY" : "LAB"
    },
    ...afternoon.map((slot, offset) => ({
      kind: "slot" as const,
      track: (kind === "theory" ? "THEORY" : "LAB") as MatrixTrack,
      slotIndex: 6 + offset,
      slotLabel: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime
    }))
  ];
}

function buildLabColumns(slots: TimeSlot[]): MatrixColumn[] {
  const templateSlots = getDaySlots(slots, DAYS[0], "lab");
  const buildPairColumns = (labSlots: TimeSlot[], offset: number) =>
    labSlots.flatMap((slot, index) => {
      const labels = slot.label.split("+").map((label) => label.trim());
      const midpoint = formatMinutes(
        parseTime(slot.startTime) + (parseTime(slot.endTime) - parseTime(slot.startTime)) / 2
      );

      return [
        {
          kind: "slot" as const,
          track: "LAB" as const,
          slotIndex: offset + index,
          partIndex: 0,
          slotLabel: labels[0] ?? slot.label,
          startTime: slot.startTime,
          endTime: midpoint
        },
        {
          kind: "slot" as const,
          track: "LAB" as const,
          slotIndex: offset + index,
          partIndex: 1,
          slotLabel: labels[1] ?? slot.label,
          startTime: midpoint,
          endTime: slot.endTime
        }
      ];
    });

  const morning = templateSlots.slice(0, 3);
  const afternoon = templateSlots.slice(3, 6);

  return [
    ...buildPairColumns(morning, 0),
    { kind: "lunch", track: "LAB" },
    ...buildPairColumns(afternoon, 3)
  ];
}

export function buildMatrixColumns(slots: TimeSlot[]) {
  return {
    theory: buildColumns(slots, "theory"),
    lab: buildLabColumns(slots)
  };
}

export function buildCourseSummaryRows(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  courses: Course[]
): CourseSummaryRow[] {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));

  return schedule.selections.map((selection) => {
    const course = courses.find((item) => item.id === selection.courseId);
    const typeLabel =
      selection.theorySlotIds.length > 0 && selection.labSlotIds.length > 0
        ? "Both"
        : selection.labSlotIds.length > 0
          ? "Lab"
          : "Theory";

    const theorySlots = selection.theorySlotIds
      .map((slotId) => slotMap.get(slotId))
      .filter((slot): slot is TimeSlot => Boolean(slot))
      .map((slot) => `${slot.label} ${slot.startTime}-${slot.endTime}`);

    const labSlots = selection.labSlotIds
      .map((slotId) => slotMap.get(slotId))
      .filter((slot): slot is TimeSlot => Boolean(slot))
      .map((slot) => `${slot.label} ${slot.startTime}-${slot.endTime}`);

    return {
      courseId: selection.courseId,
      courseCode: selection.courseCode,
      courseName: selection.courseName,
      professorName: selection.professorName,
      credits: selection.credits,
      typeLabel,
      theorySlots,
      labSlots,
      slotIds: [...selection.theorySlotIds, ...selection.labSlotIds, ...selection.combinedSlotIds],
      color: course?.color ?? "#14b8a6",
      notes: course?.options.find((option) => option.id === selection.optionId)?.notes
    };
  });
}

export function buildMatrixCells(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  courses: Course[]
): { theory: MatrixCell[][]; lab: MatrixCell[][] } {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const theoryColumns = buildColumns(slots, "theory");
  const labColumns = buildLabColumns(slots);

  function buildRows(track: MatrixTrack, columns: MatrixColumn[]) {
    return DAYS.map((day) => {
      const daySlots = getDaySlots(slots, day, track === "THEORY" ? "theory" : "lab");
      return columns.map((column) => {
        if (column.kind === "lunch") {
          return {
            id: `${day}-${track}-lunch`,
            day,
            track,
            slot: null,
            occupied: false,
            slotLabel: "Lunch",
            startTime: "",
            endTime: "",
            slotIds: [],
            courseId: null,
            courseCode: null,
            courseName: null,
            professorName: null,
            credits: null,
            color: track === "THEORY" ? "#cbd5e1" : "#cbd5e1",
            typeLabel: null
          } satisfies MatrixCell;
        }

        if (track === "LAB") {
          const slot = daySlots[column.slotIndex ?? 0] ?? null;
          const selection = slot
            ? schedule.selections.find((item) => item.labSlotIds.includes(slot.id))
            : undefined;
          const course = selection ? courseMap.get(selection.courseId) : undefined;

          const slotLabels = slot ? slot.label.split("+").map((label) => label.trim()) : [];
          const partIndex = column.partIndex ?? 0;
          const individualLabel = slotLabels[partIndex] ?? column.slotLabel ?? slot?.label ?? "";

          return {
            id: slot ? `${slot.id}-p${partIndex}` : `${day}-${track}-${column.slotIndex ?? 0}-p${partIndex}`,
            day,
            track,
            slot,
            occupied: Boolean(selection && slot),
            slotLabel: individualLabel,
            startTime: column.startTime ?? slot?.startTime ?? "",
            endTime: column.endTime ?? slot?.endTime ?? "",
            slotIds: selection
              ? [...selection.theorySlotIds, ...selection.labSlotIds, ...selection.combinedSlotIds]
              : slot
                ? [slot.id]
                : [],
            courseId: selection?.courseId ?? null,
            courseCode: selection?.courseCode ?? null,
            courseName: selection?.courseName ?? null,
            professorName: selection?.professorName ?? null,
            credits: selection?.credits ?? null,
            color: course?.color ?? "#3b82f6",
            typeLabel:
              selection?.theorySlotIds.length && selection?.labSlotIds.length
                ? "Both"
                : selection?.labSlotIds.length
                  ? "Lab"
                  : selection?.theorySlotIds.length
                    ? "Theory"
                    : null,
            notes: selection
              ? course?.options.find((option) => option.id === selection.optionId)?.notes
              : undefined,
            selection
          } satisfies MatrixCell;
        }

        const slot = daySlots[column.slotIndex ?? 0] ?? null;
        const selection = slot
          ? schedule.selections.find(
              (item) =>
                item.theorySlotIds.includes(slot.id) ||
                item.combinedSlotIds.includes(slot.id)
            )
          : undefined;
        const course = selection ? courseMap.get(selection.courseId) : undefined;

        return {
          id: slot?.id ?? `${day}-${track}-${column.slotIndex ?? 0}`,
          day,
          track,
          slot,
          occupied: Boolean(selection && slot),
          slotLabel: slot?.label ?? "",
          startTime: slot?.startTime ?? "",
          endTime: slot?.endTime ?? "",
          slotIds: selection
            ? [...selection.theorySlotIds, ...selection.labSlotIds, ...selection.combinedSlotIds]
            : slot
              ? [slot.id]
              : [],
          courseId: selection?.courseId ?? null,
          courseCode: selection?.courseCode ?? null,
          courseName: selection?.courseName ?? null,
          professorName: selection?.professorName ?? null,
          credits: selection?.credits ?? null,
          color: course?.color ?? (track === "THEORY" ? "#14b8a6" : "#3b82f6"),
          typeLabel:
            selection?.theorySlotIds.length && selection?.labSlotIds.length
              ? "Both"
              : selection?.labSlotIds.length
                ? "Lab"
                : selection?.theorySlotIds.length
                  ? "Theory"
                  : null,
          notes: selection
            ? course?.options.find((option) => option.id === selection.optionId)?.notes
            : undefined,
          selection
        } satisfies MatrixCell;
      });
    });
  }

  return {
    theory: buildRows("THEORY", theoryColumns),
    lab: buildRows("LAB", labColumns)
  };
}
