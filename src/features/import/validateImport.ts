import { ImportRow, ParsedImportRow } from './importTypes';
import { TimeSlot } from '@/engine/types';
import { resolveLabSlotIds, resolveTheorySlotIds } from './normalizeImport';
import { nanoid } from 'nanoid';

function hasEnteredSlots(value: string | undefined) {
  if (!value?.trim()) {
    return false;
  }
  return !["-", "NA", "N/A", "NIL", "NONE"].includes(value.trim().toUpperCase());
}

export function validateAndParseRow(row: ImportRow, slots?: TimeSlot[]): ParsedImportRow {
  const errors: string[] = [];
  
  if (!row.courseCode || !row.courseCode.toString().trim()) errors.push("Course code is required");
  if (!row.courseName || !row.courseName.toString().trim()) errors.push("Course name is required");
  if (!row.professorName || !row.professorName.toString().trim()) errors.push("Professor name is required");
  
  const credits = Number(row.credits);
  if (isNaN(credits) || credits <= 0) errors.push("Credits must be a positive number");

  if (slots && hasEnteredSlots(row.theorySlots) && resolveTheorySlotIds(row.theorySlots.toString(), slots).length === 0) {
    errors.push("Theory slots do not match known slot labels");
  }
  if (slots && hasEnteredSlots(row.labSlots) && resolveLabSlotIds(row.labSlots.toString(), slots).length === 0) {
    errors.push("Lab slots do not match known lab labels");
  }
  
  return {
    courseCode: row.courseCode?.toString() ?? "",
    courseName: row.courseName?.toString() ?? "",
    professorName: row.professorName?.toString() ?? "",
    theorySlots: row.theorySlots?.toString() ?? "",
    labSlots: row.labSlots?.toString() ?? "",
    credits: row.credits?.toString() ?? "",
    locked: row.locked?.toString() ?? "",
    notes: row.notes?.toString() ?? "",
    id: nanoid(),
    isValid: errors.length === 0,
    errors
  };
}
