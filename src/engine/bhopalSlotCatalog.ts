import { DayOfWeek, TimeSlot } from "./types";

// Bhopal uses a 90-minute slot system across 6 days (Mon–Sat), 7 periods per day.
// There are no separate lab slots — every slot is a standard theory block.

export const BHOPAL_DAYS: readonly DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

const TIME_BANDS = [
  ["08:30", "10:00"],
  ["10:05", "11:35"],
  ["11:40", "13:10"],
  ["13:15", "14:45"],
  ["14:50", "16:20"],
  ["16:25", "17:55"],
  ["18:00", "19:30"]
] as const;

// Slot grid: [day, slotLabel, timeBandIndex (0-based)]
type SlotEntry = [DayOfWeek, string, number];

const SLOT_ENTRIES: SlotEntry[] = [
  // Monday
  ["Monday",    "A11", 0],
  ["Monday",    "B11", 1],
  ["Monday",    "C11", 2],
  ["Monday",    "A21", 3],
  ["Monday",    "A14", 4],
  ["Monday",    "B21", 5],
  ["Monday",    "C21", 6],
  // Tuesday
  ["Tuesday",   "D11", 0],
  ["Tuesday",   "E11", 1],
  ["Tuesday",   "F11", 2],
  ["Tuesday",   "D21", 3],
  ["Tuesday",   "E14", 4],
  ["Tuesday",   "E21", 5],
  ["Tuesday",   "F21", 6],
  // Wednesday
  ["Wednesday", "A12", 0],
  ["Wednesday", "B12", 1],
  ["Wednesday", "C12", 2],
  ["Wednesday", "A22", 3],
  ["Wednesday", "B14", 4],
  ["Wednesday", "B22", 5],
  ["Wednesday", "A24", 6],
  // Thursday
  ["Thursday",  "D12", 0],
  ["Thursday",  "E12", 1],
  ["Thursday",  "F12", 2],
  ["Thursday",  "D22", 3],
  ["Thursday",  "F14", 4],
  ["Thursday",  "E22", 5],
  ["Thursday",  "F22", 6],
  // Friday
  ["Friday",    "A13", 0],
  ["Friday",    "B13", 1],
  ["Friday",    "C13", 2],
  ["Friday",    "A23", 3],
  ["Friday",    "C14", 4],
  ["Friday",    "B23", 5],
  ["Friday",    "B24", 6],
  // Saturday
  ["Saturday",  "D13", 0],
  ["Saturday",  "E13", 1],
  ["Saturday",  "F13", 2],
  ["Saturday",  "D23", 3],
  ["Saturday",  "D14", 4],
  ["Saturday",  "D24", 5],
  ["Saturday",  "E23", 6]
];

function slugBhopal(label: string, day: string) {
  return `bhopal-${label.toLowerCase()}-${day.toLowerCase()}`;
}

export const BHOPAL_SLOTS: TimeSlot[] = SLOT_ENTRIES.map(
  ([day, label, bandIdx]) => {
    const [startTime, endTime] = TIME_BANDS[bandIdx];
    return {
      id: slugBhopal(label, day),
      label,
      day,
      startTime,
      endTime,
      kind: "theory" as const,
      duration: 90
    };
  }
);
