import { getSlotCatalog, getSlotDays } from "@/engine/slotCatalog";
import { CAMPUS_LABELS, CAMPUS_SLOT_VARIANT, type Campus, type TimeSlot } from "@/engine/types";

// Every campus gets a public slot-chart page at /<campus>.
export const CAMPUS_PAGE_IDS = ["vellore", "chennai", "bhopal", "ap"] as const satisfies readonly Campus[];
export type CampusPageId = (typeof CAMPUS_PAGE_IDS)[number];

export function isCampusPageId(value: string): value is CampusPageId {
  return (CAMPUS_PAGE_IDS as readonly string[]).includes(value);
}

export type SlotRow = { label: string; kind: "theory" | "lab"; times: string[] };

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun"
};

// One row per slot label listing every period it meets, in A1, A2, B1… order.
export function slotRows(campus: CampusPageId): SlotRow[] {
  const byLabel = new Map<string, SlotRow>();
  getSlotCatalog(CAMPUS_SLOT_VARIANT[campus]).forEach((slot: TimeSlot) => {
    const row = byLabel.get(slot.label) ?? { label: slot.label, kind: slot.kind ?? "theory", times: [] };
    row.times.push(`${DAY_SHORT[slot.day]} ${slot.startTime}–${slot.endTime}`);
    byLabel.set(slot.label, row);
  });
  return [...byLabel.values()].sort((a, b) => a.label.localeCompare(b.label, "en", { numeric: true }));
}

export function slotDaysText(campus: CampusPageId) {
  const days = getSlotDays(CAMPUS_SLOT_VARIANT[campus]);
  return `${days[0]} to ${days[days.length - 1]}`;
}

export const campusLabel = (campus: CampusPageId) => CAMPUS_LABELS[campus];

// AP has slot data but no course catalog yet, so its page is a slot chart only.
// Keep in sync with the `active` flags in CampusPicker and fp-shell's campusOptions.
export const PLANNER_READY: Record<CampusPageId, boolean> = { vellore: true, chennai: true, bhopal: true, ap: false };

// Facts are limited to what the planner's own slot data shows (see src/engine/*SlotCatalog.ts).
const STANDARD_FACTS = [
  "Theory slots are 50-minute periods; most letter slots like A1 meet twice a week.",
  "Slots ending in 1 mostly run in the morning and slots ending in 2 in the afternoon, so A1 is a morning slot and A2 its afternoon twin.",
  "T-prefixed slots (TA1, TB1, TAA1…) are tutorial periods that meet once a week.",
  "Labs are 100-minute blocks registered as a pair, like L23 + L24. L1–L30 are morning labs and L31–L60 afternoon labs.",
  "Two courses clash when they share any period, and the planner never puts clashing courses together."
];

export const CAMPUS_FACTS: Record<CampusPageId, string[]> = {
  vellore: STANDARD_FACTS,
  chennai: STANDARD_FACTS,
  bhopal: [
    "Every slot is a 90-minute period, seven a day from 08:30 to 19:30.",
    "There are no separate lab slots; labs use the same 90-minute periods.",
    "Two courses clash when they share any period, and the planner never puts clashing courses together."
  ],
  ap: [
    "Theory slots are 50-minute periods starting on the hour, from 08:00 to 19:50.",
    "Most letter slots like A1 meet twice a week; T-prefixed slots (TA1, TB1, TAA1…) are tutorial periods that meet once a week.",
    "Labs are registered as a pair, like L23+L24. L1–L30 run before 14:00 and L31–L60 in the afternoon and evening.",
    "Two courses clash when they share any period."
  ]
};
