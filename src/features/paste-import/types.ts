import { ImportRow } from "@/features/import/importTypes";

export type PasteImportFormat = "json" | "csv" | "text";

export interface PasteImportMetadata {
  campus?: string;
  semesterLabel?: string;
}

export interface PasteImportParseResult {
  format: PasteImportFormat;
  rows: ImportRow[];
  metadata: PasteImportMetadata;
}