import { DayOfWeek, DAYS, SlotVariant, TimeSlot } from "./types";
import { AP_DAYS, AP_SLOTS } from "./apSlotCatalog";
import { BHOPAL_DAYS, BHOPAL_SLOTS } from "./bhopalSlotCatalog";

type SlotRow = [DayOfWeek, string, string, string];

const theoryRows: SlotRow[] = [
  ["Monday", "08:00", "08:50", "A1"],
  ["Monday", "09:00", "09:50", "F1"],
  ["Monday", "10:00", "10:50", "D1"],
  ["Monday", "11:00", "11:50", "TB1"],
  ["Monday", "12:00", "12:50", "TG1"],
  ["Monday", "14:00", "14:50", "A2"],
  ["Monday", "15:00", "15:50", "F2"],
  ["Monday", "16:00", "16:50", "D2"],
  ["Monday", "17:00", "17:50", "TB2"],
  ["Monday", "18:00", "18:50", "TG2"],
  ["Monday", "19:01", "19:50", "V3"],
  ["Tuesday", "08:00", "08:50", "B1"],
  ["Tuesday", "09:00", "09:50", "G1"],
  ["Tuesday", "10:00", "10:50", "E1"],
  ["Tuesday", "11:00", "11:50", "TC1"],
  ["Tuesday", "12:00", "12:50", "TAA1"],
  ["Tuesday", "14:00", "14:50", "B2"],
  ["Tuesday", "15:00", "15:50", "G2"],
  ["Tuesday", "16:00", "16:50", "E2"],
  ["Tuesday", "17:00", "17:50", "TC2"],
  ["Tuesday", "18:00", "18:50", "TAA2"],
  ["Tuesday", "19:01", "19:50", "V4"],
  ["Wednesday", "08:00", "08:50", "C1"],
  ["Wednesday", "09:00", "09:50", "A1"],
  ["Wednesday", "10:00", "10:50", "F1"],
  ["Wednesday", "11:00", "11:50", "V1"],
  ["Wednesday", "12:00", "12:50", "V2"],
  ["Wednesday", "14:00", "14:50", "C2"],
  ["Wednesday", "15:00", "15:50", "A2"],
  ["Wednesday", "16:00", "16:50", "F2"],
  ["Wednesday", "17:00", "17:50", "TD2"],
  ["Wednesday", "18:00", "18:50", "TBB2"],
  ["Wednesday", "19:01", "19:50", "V5"],
  ["Thursday", "08:00", "08:50", "D1"],
  ["Thursday", "09:00", "09:50", "B1"],
  ["Thursday", "10:00", "10:50", "G1"],
  ["Thursday", "11:00", "11:50", "TE1"],
  ["Thursday", "12:00", "12:50", "TCC1"],
  ["Thursday", "14:00", "14:50", "D2"],
  ["Thursday", "15:00", "15:50", "B2"],
  ["Thursday", "16:00", "16:50", "G2"],
  ["Thursday", "17:00", "17:50", "TE2"],
  ["Thursday", "18:00", "18:50", "TCC2"],
  ["Thursday", "19:01", "19:50", "V6"],
  ["Friday", "08:00", "08:50", "E1"],
  ["Friday", "09:00", "09:50", "C1"],
  ["Friday", "10:00", "10:50", "TA1"],
  ["Friday", "11:00", "11:50", "TF1"],
  ["Friday", "12:00", "12:50", "TD1"],
  ["Friday", "14:00", "14:50", "E2"],
  ["Friday", "15:00", "15:50", "C2"],
  ["Friday", "16:00", "16:50", "TA2"],
  ["Friday", "17:00", "17:50", "TF2"],
  ["Friday", "18:00", "18:50", "TDD2"],
  ["Friday", "19:01", "19:50", "V7"]
];

const labRows: SlotRow[] = [
  ["Monday", "08:00", "09:40", "L1 + L2"],
  ["Monday", "09:51", "11:30", "L3 + L4"],
  ["Monday", "11:40", "13:20", "L5 + L6"],
  ["Monday", "14:00", "15:40", "L31 + L32"],
  ["Monday", "15:51", "17:30", "L33 + L34"],
  ["Monday", "17:40", "19:20", "L35 + L36"],
  ["Tuesday", "08:00", "09:40", "L7 + L8"],
  ["Tuesday", "09:51", "11:30", "L9 + L10"],
  ["Tuesday", "11:40", "13:20", "L11 + L12"],
  ["Tuesday", "14:00", "15:40", "L37 + L38"],
  ["Tuesday", "15:51", "17:30", "L39 + L40"],
  ["Tuesday", "17:40", "19:20", "L41 + L42"],
  ["Wednesday", "08:00", "09:40", "L13 + L14"],
  ["Wednesday", "09:51", "11:30", "L15 + L16"],
  ["Wednesday", "11:40", "13:20", "L17 + L18"],
  ["Wednesday", "14:00", "15:40", "L43 + L44"],
  ["Wednesday", "15:51", "17:30", "L45 + L46"],
  ["Wednesday", "17:40", "19:20", "L47 + L48"],
  ["Thursday", "08:00", "09:40", "L19 + L20"],
  ["Thursday", "09:51", "11:30", "L21 + L22"],
  ["Thursday", "11:40", "13:20", "L23 + L24"],
  ["Thursday", "14:00", "15:40", "L49 + L50"],
  ["Thursday", "15:51", "17:30", "L51 + L52"],
  ["Thursday", "17:40", "19:20", "L53 + L54"],
  ["Friday", "08:00", "09:40", "L25 + L26"],
  ["Friday", "09:51", "11:30", "L27 + L28"],
  ["Friday", "11:40", "13:20", "L29 + L30"],
  ["Friday", "14:00", "15:40", "L55 + L56"],
  ["Friday", "15:51", "17:30", "L57 + L58"],
  ["Friday", "17:40", "19:20", "L59 + L60"]
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STANDARD_SLOTS: TimeSlot[] = [
  ...theoryRows.map(([day, startTime, endTime, label], index) => ({
    id: `theory-${slug(label)}-${slug(day)}-${index}`,
    label,
    day,
    startTime,
    endTime,
    kind: "theory" as const,
    duration: 50
  })),
  ...labRows.map(([day, startTime, endTime, label]) => ({
    id: `lab-${slug(label)}`,
    label,
    day,
    startTime,
    endTime,
    kind: "lab" as const,
    duration: 100
  }))
];

export const SLOT_CATALOGS: Record<SlotVariant, TimeSlot[]> = {
  standard: STANDARD_SLOTS,
  bhopal: BHOPAL_SLOTS,
  ap: AP_SLOTS
};

export const SLOT_CATALOG_DAYS: Record<SlotVariant, readonly DayOfWeek[]> = {
  standard: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  bhopal: BHOPAL_DAYS,
  ap: AP_DAYS
};

export function getSlotCatalog(variant: SlotVariant): TimeSlot[] {
  return SLOT_CATALOGS[variant];
}

export function getSlotDays(variant: SlotVariant): readonly DayOfWeek[] {
  return SLOT_CATALOG_DAYS[variant];
}

export function getSlotDaysForSlots(slots: TimeSlot[]): readonly DayOfWeek[] {
  const days = Array.from(new Set(slots.map((slot) => slot.day)));
  if (days.length === 0) {
    return SLOT_CATALOG_DAYS.standard;
  }
  return days.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
}

export const SLOT_CATALOG = STANDARD_SLOTS;
export { AP_DAYS, BHOPAL_DAYS };

const baseLetters = ["A", "B", "C", "D", "E", "F", "G"] as const;

export type SlotNameOption = {
  label: string;
  slotIds: string[];
};

export function getSlotIdsByLabel(slots: TimeSlot[], label: string) {
  return slots.filter((slot) => slot.label === label).map((slot) => slot.id);
}

export function getLabelsForSlotIds(slots: TimeSlot[], slotIds: string[]) {
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  return Array.from(
    new Set(
      slotIds
        .map((slotId) => slotMap.get(slotId)?.label)
        .filter((label): label is string => Boolean(label))
    )
  );
}

export function getTheoryCombinationOptions(slots: TimeSlot[]): SlotNameOption[] {
  const labels = new Set(
    slots.filter((slot) => slot.kind === "theory").map((slot) => slot.label)
  );
  const options: SlotNameOption[] = [];

  for (const letter of baseLetters) {
    for (const suffix of ["1", "2"]) {
      const base = `${letter}${suffix}`;
      const tutorial = `T${letter}${suffix}`;
      const doubleTutorial = `T${letter}${letter}${suffix}`;

      if (labels.has(base)) {
        options.push({ label: base, slotIds: getSlotIdsByLabel(slots, base) });
      }

      if (labels.has(base) && labels.has(tutorial)) {
        const names = [base, tutorial];
        options.push({
          label: names.join(" + "),
          slotIds: names.flatMap((name) => getSlotIdsByLabel(slots, name))
        });
      }

      if (labels.has(base) && labels.has(tutorial) && labels.has(doubleTutorial)) {
        const names = [base, tutorial, doubleTutorial];
        options.push({
          label: names.join(" + "),
          slotIds: names.flatMap((name) => getSlotIdsByLabel(slots, name))
        });
      }

      if (labels.has(doubleTutorial)) {
        options.push({
          label: doubleTutorial,
          slotIds: getSlotIdsByLabel(slots, doubleTutorial)
        });
      }
    }
  }

  const specialOptions = Array.from(labels)
    .filter((label) => label.startsWith("S") || /^[A-Z]\d{2}$/.test(label)) // Support Bhopal A11, F24 etc.
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((label) => ({
      label,
      slotIds: getSlotIdsByLabel(slots, label)
    }));

  return [...options, ...specialOptions];
}

export function getLabPairOptions(slots: TimeSlot[]): SlotNameOption[] {
  return slots
    .filter((slot) => slot.kind === "lab")
    .sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return dayDiff || a.startTime.localeCompare(b.startTime);
    })
    .map((slot) => ({
      label: slot.label,
      slotIds: [slot.id]
    }));
}
