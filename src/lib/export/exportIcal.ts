import { DayOfWeek, ScoredTimetable, TimeSlot } from "@/engine/types";

const DAY_TO_ICAL: Record<DayOfWeek, string> = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA"
};

export function exportTimetableIcal(
  schedule: ScoredTimetable,
  slots: TimeSlot[],
  semesterStartDate: string,
  semesterEndDate: string,
  timetableName = "My FFCS Timetable"
) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FFCS Planner//Ultimate FFCS Timetable//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcal(timetableName)}`,
    "X-WR-TIMEZONE:Asia/Kolkata"
  ];
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const createdAt = Date.now();

  for (const selection of schedule.selections) {
    const allSlotIds = [...selection.theorySlotIds, ...selection.labSlotIds];

    for (const slotId of allSlotIds) {
      const slot = slotMap.get(slotId);
      if (!slot) {
        continue;
      }

      const firstDate = getFirstOccurrence(semesterStartDate, slot.day);
      const dtstart = formatIcalDateTime(firstDate, slot.startTime);
      const dtend = formatIcalDateTime(firstDate, slot.endTime);
      const until = formatIcalDate(semesterEndDate);

      lines.push(
        "BEGIN:VEVENT",
        `UID:${selection.courseCode}-${slotId}-${createdAt}@ffcsplanner`,
        `SUMMARY:${escapeIcal(`${selection.courseCode} - ${selection.courseName}`)}`,
        `DESCRIPTION:${escapeIcal(
          `Professor: ${selection.professorName}\\nSlot: ${slot.label}\\nType: ${slot.kind ?? "class"}`
        )}`,
        "LOCATION:VIT Vellore",
        `DTSTART;TZID=Asia/Kolkata:${dtstart}`,
        `DTEND;TZID=Asia/Kolkata:${dtend}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${DAY_TO_ICAL[slot.day]};UNTIL=${until}`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${timetableName.replace(/\s+/g, "_")}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getFirstOccurrence(fromDate: string, dayName: DayOfWeek) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  const targetDay = days.indexOf(dayName);
  const date = new Date(`${fromDate}T00:00:00+05:30`);
  while (date.getDay() !== targetDay) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function formatIcalDateTime(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function formatIcalDate(date: string) {
  return `${date.replace(/-/g, "")}T235959Z`;
}

function escapeIcal(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
