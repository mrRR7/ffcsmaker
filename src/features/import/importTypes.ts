export interface ImportRow {
  courseCode: string;
  courseName: string;
  professorName: string;
  theorySlots: string;
  labSlots: string;
  credits: string;
  locked?: string;
  notes?: string;
}

export interface ParsedImportRow extends ImportRow {
  id: string; // for React keys
  isValid: boolean;
  errors: string[];
}
