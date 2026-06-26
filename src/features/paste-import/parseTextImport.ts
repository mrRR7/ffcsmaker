import { ImportRow } from "@/features/import/importTypes";
import { parsePastedText } from "./parsePastedText";
import { PasteImportParseResult } from "./types";

export function parseTextImport(input: string): PasteImportParseResult {
  const rows: ImportRow[] = parsePastedText(input).map((row) => ({
    courseCode: row.courseCode ?? "",
    courseName: row.courseName ?? row.courseCode ?? "",
    professorName: row.professorName ?? "",
    program: "",
    theorySlots: row.theorySlotRaw ?? "",
    labSlots: row.labSlotRaw ?? "",
    credits: row.credits?.toString() ?? "",
    notes: ""
  }));

  if (rows.length === 0) {
    throw new Error("No text rows found.");
  }

  return {
    format: "text",
    rows,
    metadata: {}
  };
}