import { ImportRow } from "./importTypes";

type RawImportRow = Record<string, unknown>;

const columnAliases: Record<keyof ImportRow, string[]> = {
  courseCode: ["coursecode", "code", "subjectcode"],
  courseName: ["coursename", "course", "subjectname", "subject"],
  professorName: ["professorname", "professor", "facultyname", "faculty", "teacher"],
  theorySlots: ["theoryslots", "theoryslot", "theory", "tslots", "tslot"],
  labSlots: [
    "labslots",
    "labslot",
    "lab",
    "laboratoryslots",
    "laboratoryslot",
    "practicalslots",
    "practicalslot",
    "lslots",
    "lslot"
  ],
  credits: ["credits", "credit"],
  program: [
    "program",
    "branch",
    "department",
    "specialization"
  ],
  locked: ["locked", "lock"],
  notes: ["notes", "note", "remarks", "remark"]
};

function canonicalHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export function normalizeImportRowColumns(row: RawImportRow): ImportRow {
  const cells = new Map(
    Object.entries(row).map(([header, value]) => [canonicalHeader(header), cellText(value)])
  );

  function read(field: keyof ImportRow) {
    for (const alias of columnAliases[field]) {
      const value = cells.get(alias);
      if (value !== undefined) {
        return value;
      }
    }
    return "";
  }

  return {
    courseCode: read("courseCode"),
    courseName: read("courseName"),
    professorName: read("professorName"),
    program: read("program"),
    theorySlots: read("theorySlots"),
    labSlots: read("labSlots"),
    credits: read("credits"),
    locked: read("locked"),
    notes: read("notes")
  };
}
