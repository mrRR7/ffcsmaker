import { parseCsvImport } from "./parseCsvImport";
import { parseJsonImport } from "./parseJsonImport";
import { parseTextImport } from "./parseTextImport";
import { PasteImportParseResult } from "./types";

function looksLikeJson(input: string) {
  const trimmed = input.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function looksLikeCsv(input: string) {
  const firstLine = input.trimStart().split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes(",");
}

export function parseImport(input: string): PasteImportParseResult {
  const errors: Error[] = [];
  const shouldTryJson = looksLikeJson(input);
  const shouldTryCsv = shouldTryJson || looksLikeCsv(input);

  if (shouldTryJson) {
    try {
      return parseJsonImport(input);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error("JSON parsing failed."));
    }
  }

  if (shouldTryCsv) {
    try {
      return parseCsvImport(input);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error("CSV parsing failed."));
    }
  }

  try {
    return parseTextImport(input);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error("Text parsing failed."));
  }

  throw errors[errors.length - 1] ?? new Error("No importable rows found.");
}