import Papa from "papaparse";
import { normalizeImportRowColumns } from "@/features/import/normalizeColumns";
import { PasteImportParseResult } from "./types";

export function parseCsvImport(input: string): PasteImportParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(input, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    throw new Error("CSV could not be parsed.");
  }

  const rows = parsed.data.map(normalizeImportRowColumns);
  const hasAnyImportValue = rows.some((row) =>
    Object.values(row).some((value) => value?.toString().trim())
  );

  if (rows.length === 0 || !hasAnyImportValue) {
    throw new Error("No CSV rows found.");
  }

  return {
    format: "csv",
    rows,
    metadata: {}
  };
}