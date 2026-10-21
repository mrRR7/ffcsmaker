import { DayOfWeek, TimeSlot } from "./types";

export const AP_DAYS = [
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

type ApSlotRow = [DayOfWeek, string, string, string];

// Theory periods: 08:00-12:50 and 14:00-18:50 (lunch 13:00-13:50, nothing at 19:00).
// Some periods carry two slot labels (e.g. "G1, TC1") - both occupy the period.
const THEORY_PERIODS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00"
] as const;

const AP_THEORY_GRID: Record<(typeof AP_DAYS)[number], string[][]> = {
  Tuesday: [["TFF1"], ["A1"], ["B1"], ["G1", "TC1"], ["D1"], ["F2"], ["A2"], ["B2"], ["G2", "TC2"], ["TDD2"]],
  Wednesday: [["TGG1"], ["D1"], ["F1"], ["E1", "SC2"], ["B1"], ["D2"], ["G2", "TF2"], ["E2"], ["B2"], ["TCC2"]],
  Thursday: [["TEE1"], ["C1"], ["TD1"], ["TAA1"], ["TBB1", "CLUB"], ["TE2"], ["C2"], ["TD2", "TG2"], ["A2"], ["TFF2"]],
  Friday: [["TCC1"], ["TB1"], ["TA1"], ["F1"], ["TE1", "SD2"], ["C2"], ["TB2"], ["TA2"], ["F2"], ["TEE2"]],
  Saturday: [["TDD1"], ["E1", "SE2"], ["C1"], ["G1", "TF1"], ["A1"], ["D2"], ["E2"], ["TAA2", "ECS"], ["TBB2", "CLUB"], ["TGG2"]]
};

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const AP_THEORY_ROWS: ApSlotRow[] = AP_DAYS.flatMap((day) =>
  AP_THEORY_GRID[day].flatMap((labels, index) =>
    labels.map((label): ApSlotRow => [
      day,
      THEORY_PERIODS[index],
      addMinutes(THEORY_PERIODS[index], 50),
      label
    ])
  )
);

// VTOP shows labs as single periods (L1, L2, ...); courses take consecutive pairs.
// Pairs: 08:00-09:40, 09:50-11:30, 11:40-13:10, 14:00-15:40, 15:50-17:30, 17:40-19:10.
const AP_LAB_ROWS: ApSlotRow[] = [
  ["Tuesday", "08:00", "09:40", "L1+L2"],
  ["Tuesday", "09:50", "11:30", "L3+L4"],
  ["Tuesday", "11:40", "13:10", "L5+L6"],
  ["Tuesday", "14:00", "15:40", "L31+L32"],
  ["Tuesday", "15:50", "17:30", "L33+L34"],
  ["Tuesday", "17:40", "19:10", "L35+L36"],
  ["Wednesday", "08:00", "09:40", "L7+L8"],
  ["Wednesday", "09:50", "11:30", "L9+L10"],
  ["Wednesday", "11:40", "13:10", "L11+L12"],
  ["Wednesday", "14:00", "15:40", "L37+L38"],
  ["Wednesday", "15:50", "17:30", "L39+L40"],
  ["Wednesday", "17:40", "19:10", "L41+L42"],
  ["Thursday", "08:00", "09:40", "L13+L14"],
  ["Thursday", "09:50", "11:30", "L15+L16"],
  ["Thursday", "11:40", "13:10", "L17+L18"],
  ["Thursday", "14:00", "15:40", "L43+L44"],
  ["Thursday", "15:50", "17:30", "L45+L46"],
  ["Thursday", "17:40", "19:10", "L47+L48"],
  ["Friday", "08:00", "09:40", "L19+L20"],
  ["Friday", "09:50", "11:30", "L21+L22"],
  ["Friday", "11:40", "13:10", "L23+L24"],
  ["Friday", "14:00", "15:40", "L49+L50"],
  ["Friday", "15:50", "17:30", "L51+L52"],
  ["Friday", "17:40", "19:10", "L53+L54"],
  ["Saturday", "08:00", "09:40", "L25+L26"],
  ["Saturday", "09:50", "11:30", "L27+L28"],
  ["Saturday", "11:40", "13:10", "L29+L30"],
  ["Saturday", "14:00", "15:40", "L55+L56"],
  ["Saturday", "15:50", "17:30", "L57+L58"],
  ["Saturday", "17:40", "19:10", "L59+L60"]
];

function slug(value: string) {
  return value.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "");
}

function minutesBetween(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

export const AP_SLOTS: TimeSlot[] = [
  ...AP_THEORY_ROWS.map(([day, startTime, endTime, label]) => ({
    id: `ap-theory-${slug(label)}-${day.toLowerCase()}-0`,
    label,
    day,
    startTime,
    endTime,
    kind: "theory" as const,
    duration: minutesBetween(startTime, endTime)
  })),
  ...AP_LAB_ROWS.map(([day, startTime, endTime, label]) => ({
    id: `ap-lab-${slug(label)}-${day.toLowerCase()}`,
    label,
    day,
    startTime,
    endTime,
    kind: "lab" as const,
    duration: minutesBetween(startTime, endTime)
  }))
];
