import { ImportRow } from "@/features/import/importTypes";
import { PasteImportParseResult } from "./types";

type JsonCourseOption = {
  professorName?: unknown;
  theorySlots?: unknown;
  labSlots?: unknown;
  program?: unknown;
  notes?: unknown;
};

type JsonCourse = {
  courseCode?: unknown;
  courseName?: unknown;
  credits?: unknown;
  options?: unknown;
};

type JsonImport = {
  campus?: unknown;
  semesterLabel?: unknown;
  courses?: unknown;
};

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function slotListToText(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join("+");
  }
  return asText(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseJsonImport(input: string): PasteImportParseResult {
  const json = JSON.parse(input) as JsonImport;

  if (!isObject(json) || !Array.isArray(json.courses)) {
    throw new Error("JSON import must include courses.");
  }

  const rows: ImportRow[] = [];

  for (const rawCourse of json.courses) {
    if (!isObject(rawCourse)) {
      continue;
    }

    const course = rawCourse as JsonCourse;
    if (!Array.isArray(course.options)) {
      continue;
    }

    for (const rawOption of course.options) {
      if (!isObject(rawOption)) {
        continue;
      }

      const option = rawOption as JsonCourseOption;
      rows.push({
        courseCode: asText(course.courseCode),
        courseName: asText(course.courseName),
        professorName: asText(option.professorName),
        program: asText(option.program),
        theorySlots: slotListToText(option.theorySlots),
        labSlots: slotListToText(option.labSlots),
        credits: asText(course.credits),
        notes: asText(option.notes)
      });
    }
  }

  if (rows.length === 0) {
    throw new Error("JSON import did not contain course options.");
  }

  return {
    format: "json",
    rows,
    metadata: {
      campus: asText(json.campus) || undefined,
      semesterLabel: asText(json.semesterLabel) || undefined
    }
  };
}