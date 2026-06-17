import { DayOfWeek, TimeSlot } from "./types";

export const AP_DAYS = [
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

type ApSlotRow = [DayOfWeek, string, string, string];

const AP_THEORY_ROWS: ApSlotRow[] = [
  ["Tuesday", "08:00", "08:50", "TFF1"],
  ["Wednesday", "08:00", "08:50", "TGG1"],
  ["Thursday", "08:00", "08:50", "TEE1"],
  ["Friday", "08:00", "08:50", "TCC1"],
  ["Saturday", "08:00", "08:50", "TDD1"],
  ["Tuesday", "09:00", "09:50", "A1"],
  ["Wednesday", "09:00", "09:50", "D1"],
  ["Thursday", "09:00", "09:50", "C1"],
  ["Friday", "09:00", "09:50", "TB1"],
  ["Saturday", "09:00", "09:50", "E1"],
  ["Tuesday", "10:00", "10:50", "B1"],
  ["Wednesday", "10:00", "10:50", "F1"],
  ["Thursday", "10:00", "10:50", "TG1"],
  ["Friday", "10:00", "10:50", "TA1"],
  ["Saturday", "10:00", "10:50", "C1"],
  ["Tuesday", "11:00", "11:50", "TC1"],
  ["Wednesday", "11:00", "11:50", "E1"],
  ["Thursday", "11:00", "11:50", "TAA1"],
  ["Friday", "11:00", "11:50", "F1"],
  ["Saturday", "11:00", "11:50", "TF1"],
  ["Tuesday", "12:00", "12:50", "G1"],
  ["Wednesday", "12:00", "12:50", "SC2"],
  ["Thursday", "12:00", "12:50", "ECS"],
  ["Friday", "12:00", "12:50", "TE1"],
  ["Saturday", "12:00", "12:50", "G1"],
  ["Tuesday", "13:00", "13:50", "D1"],
  ["Wednesday", "13:00", "13:50", "B1"],
  ["Thursday", "13:00", "13:50", "TBB1"],
  ["Friday", "13:00", "13:50", "SD2"],
  ["Saturday", "13:00", "13:50", "A1"],
  ["Tuesday", "14:00", "14:50", "F2"],
  ["Wednesday", "14:00", "14:50", "D2"],
  ["Thursday", "14:00", "14:50", "TE2"],
  ["Friday", "14:00", "14:50", "C2"],
  ["Saturday", "14:00", "14:50", "D2"],
  ["Tuesday", "15:00", "15:50", "A2"],
  ["Wednesday", "15:00", "15:50", "TF2"],
  ["Thursday", "15:00", "15:50", "SE1"],
  ["Friday", "15:00", "15:50", "TB2"],
  ["Saturday", "15:00", "15:50", "E2"],
  ["Tuesday", "16:00", "16:50", "B2"],
  ["Wednesday", "16:00", "16:50", "G2"],
  ["Thursday", "16:00", "16:50", "C2"],
  ["Friday", "16:00", "16:50", "TA2"],
  ["Saturday", "16:00", "16:50", "SD1"],
  ["Tuesday", "17:00", "17:50", "TC2"],
  ["Wednesday", "17:00", "17:50", "SC1"],
  ["Thursday", "17:00", "17:50", "A2"],
  ["Friday", "17:00", "17:50", "F2"],
  ["Saturday", "17:00", "17:50", "TAA2"],
  ["Tuesday", "18:00", "18:50", "G2"],
  ["Wednesday", "18:00", "18:50", "B2"],
  ["Thursday", "18:00", "18:50", "TD2"],
  ["Friday", "18:00", "18:50", "TEE2"],
  ["Saturday", "18:00", "18:50", "ECS"],
  ["Tuesday", "19:00", "19:50", "TDD2"],
  ["Wednesday", "19:00", "19:50", "TCC2"],
  ["Thursday", "19:00", "19:50", "TGG2"],
  ["Saturday", "19:00", "19:50", "TFF2"]
];

const AP_LAB_ROWS: ApSlotRow[] = [
  ["Tuesday", "08:00", "09:50", "L1+L2"],
  ["Tuesday", "10:00", "11:50", "L3+L4"],
  ["Tuesday", "12:00", "13:30", "L5+L6"],
  ["Tuesday", "14:00", "15:40", "L31+L32"],
  ["Tuesday", "16:00", "17:40", "L33+L34"],
  ["Tuesday", "18:00", "19:30", "L35+L36"],
  ["Wednesday", "08:00", "09:50", "L7+L8"],
  ["Wednesday", "10:00", "11:50", "L9+L10"],
  ["Wednesday", "12:00", "13:30", "L11+L12"],
  ["Wednesday", "14:00", "15:40", "L37+L38"],
  ["Wednesday", "16:00", "17:40", "L39+L40"],
  ["Wednesday", "18:00", "19:30", "L41+L42"],
  ["Thursday", "08:00", "09:50", "L13+L14"],
  ["Thursday", "10:00", "11:50", "L15+L16"],
  ["Thursday", "12:00", "13:30", "L17+L18"],
  ["Thursday", "14:00", "15:40", "L43+L44"],
  ["Thursday", "16:00", "17:40", "L45+L46"],
  ["Thursday", "18:00", "19:30", "L47+L48"],
  ["Friday", "08:00", "09:50", "L19+L20"],
  ["Friday", "10:00", "11:50", "L21+L22"],
  ["Friday", "12:00", "13:30", "L23+L24"],
  ["Friday", "14:00", "15:40", "L49+L50"],
  ["Friday", "16:00", "17:40", "L51+L52"],
  ["Friday", "18:00", "19:30", "L53+L54"],
  ["Saturday", "08:00", "09:50", "L25+L26"],
  ["Saturday", "10:00", "11:50", "L27+L28"],
  ["Saturday", "12:00", "13:30", "L29+L30"],
  ["Saturday", "14:00", "15:40", "L55+L56"],
  ["Saturday", "16:00", "17:40", "L57+L58"],
  ["Saturday", "18:00", "19:30", "L59+L60"]
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
