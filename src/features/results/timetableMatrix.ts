import { Course, DayOfWeek, ScoredTimetable, TimeSlot, TimetableSelection } from "@/engine/types";
import { formatMinutes, parseTime } from "@/engine/conflict";
import { getSlotDaysForSlots } from "@/engine/slotCatalog";

export type MatrixTrack = "THEORY" | "LAB";

export type MatrixColumn = {
  kind: "slot" | "lunch";
  track: MatrixTrack;
  partIndex?: number;
  slotLabel?: string;
  startTime?: string;
  endTime?: string;
  sourceStartTime?: string;
  sourceEndTime?: string;
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
  return [...slots].sort((a, b) => {
    const startDiff = parseTime(a.startTime) - parseTime(b.startTime);
    return startDiff || parseTime(a.endTime) - parseTime(b.endTime);
  });
}

function getDaySlots(slots: TimeSlot[], day: DayOfWeek, kind: "theory" | "lab") {
  return sortSlots(slots.filter((slot) => slot.day === day && slot.kind === kind));
}

function getTimeBands(slots: TimeSlot[], kind: "theory" | "lab") {
  return Array.from(
    new Map(
      sortSlots(slots.filter((slot) => slot.kind === kind)).map((slot) => [
        `${slot.startTime}-${slot.endTime}`,
        slot
      ])
    ).values()
  );
}

function addLunchColumn(columns: MatrixColumn[]) {
  if (columns.length < 2) {
    return columns;
  }

  let largestGap = 0;
  let insertAfter = -1;
  for (let index = 0; index < columns.length - 1; index += 1) {
    const currentEnd = columns[index].sourceEndTime ?? columns[index].endTime;
    const nextStart = columns[index + 1].sourceStartTime ?? columns[index + 1].startTime;
    if (!currentEnd || !nextStart) {
      continue;
    }
    const gap = parseTime(nextStart) - parseTime(currentEnd);
    if (gap > largestGap) {
      largestGap = gap;
      insertAfter = index;
    }
  }

  if (largestGap < 25 || insertAfter < 0) {
    return columns;
  }

  return [
    ...columns.slice(0, insertAfter + 1),
    { kind: "lunch" as const, track: columns[0].track },
    ...columns.slice(insertAfter + 1)
  ];
}

function buildTheoryColumns(slots: TimeSlot[]): MatrixColumn[] {
  return addLunchColumn(
    getTimeBands(slots, "theory").map((slot) => ({
      kind: "slot" as const,
      track: "THEORY" as const,
      slotLabel: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime
    }))
  );
}

function buildLabColumns(slots: TimeSlot[]): MatrixColumn[] {
  const columns = getTimeBands(slots, "lab").flatMap((slot) => {
    const labels = slot.label.split("+").map((label) => label.trim());
    const midpoint = formatMinutes(
      parseTime(slot.startTime) +
        (parseTime(slot.endTime) - parseTime(slot.startTime)) / 2
    );

    return [
      {
        kind: "slot" as const,
        track: "LAB" as const,
        partIndex: 0,
        slotLabel: labels[0] ?? slot.label,
        startTime: slot.startTime,
        endTime: midpoint,
        sourceStartTime: slot.startTime,
        sourceEndTime: slot.endTime
      },
      {
        kind: "slot" as const,
        track: "LAB" as const,
        partIndex: 1,
        slotLabel: labels[1] ?? slot.label,
        startTime: midpoint,
        endTime: slot.endTime,
        sourceStartTime: slot.startTime,
        sourceEndTime: slot.endTime
      }
    ];
  });

  return addLunchColumn(columns);
}

export function buildMatrixColumns(slots: TimeSlot[]) {
  return {
    theory: buildTheoryColumns(slots),
    lab: buildLabColumns(slots)
  };
}

function formatSlotGroups(slotIds: string[], slotMap: Map<string, TimeSlot>) {
  const groups = new Map<string, TimeSlot[]>();
  const days = getSlotDaysForSlots(Array.from(slotMap.values()));
  for (const slotId of slotIds) {
    const slot = slotMap.get(slotId);
    if (!slot) {
      continue;
    }
    groups.set(slot.label, [...(groups.get(slot.label) ?? []), slot]);
  }

  return Array.from(groups.entries()).map(([label, group]) => {
    const details = [...group]
      .sort((a, b) => {
        const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
        return dayDiff || parseTime(a.startTime) - parseTime(b.startTime);
      })
      .map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
      .join("; ");
    return `${label} (${details})`;
  });
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

    return {
      courseId: selection.courseId,
      courseCode: selection.courseCode,
      courseName: selection.courseName,
      professorName: selection.professorName,
      credits: selection.credits,
      typeLabel,
      theorySlots: formatSlotGroups(selection.theorySlotIds, slotMap),
      labSlots: formatSlotGroups(selection.labSlotIds, slotMap),
      slotIds: [
        ...selection.theorySlotIds,
        ...selection.labSlotIds,
        ...selection.combinedSlotIds
      ],
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
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const days = getSlotDaysForSlots(slots);
  const { theory: theoryColumns, lab: labColumns } = buildMatrixColumns(slots);

  function selectionForSlot(slot: TimeSlot | null, track: MatrixTrack) {
    if (!slot) {
      return undefined;
    }
    return schedule.selections.find((item) =>
      track === "LAB"
        ? item.labSlotIds.includes(slot.id)
        : item.theorySlotIds.includes(slot.id) || item.combinedSlotIds.includes(slot.id)
    );
  }

  function buildRows(track: MatrixTrack, columns: MatrixColumn[]) {
    return days.map((day) => {
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
            color: "#cbd5e1",
            typeLabel: null
          } satisfies MatrixCell;
        }

        const slot =
          track === "LAB"
            ? daySlots.find(
                (candidate) =>
                  candidate.startTime === column.sourceStartTime &&
                  candidate.endTime === column.sourceEndTime
              ) ?? null
            : daySlots.find(
                (candidate) =>
                  candidate.startTime === column.startTime &&
                  candidate.endTime === column.endTime
              ) ?? null;
        const selection = selectionForSlot(slot, track);
        const course = selection ? courseMap.get(selection.courseId) : undefined;
        const slotLabels = slot ? slot.label.split("+").map((label) => label.trim()) : [];
        const partIndex = column.partIndex ?? 0;
        const individualLabel =
          track === "LAB"
            ? slotLabels[partIndex] ?? column.slotLabel ?? slot?.label ?? ""
            : slot?.label ?? "";

        return {
          id: slot
            ? `${slot.id}${track === "LAB" ? `-p${partIndex}` : ""}`
            : `${day}-${track}-${column.startTime ?? "empty"}-${partIndex}`,
          day,
          track,
          slot,
          occupied: Boolean(selection && slot),
          slotLabel: individualLabel,
          startTime: column.startTime ?? slot?.startTime ?? "",
          endTime: column.endTime ?? slot?.endTime ?? "",
          slotIds: selection
            ? [
                ...selection.theorySlotIds,
                ...selection.labSlotIds,
                ...selection.combinedSlotIds
              ]
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
