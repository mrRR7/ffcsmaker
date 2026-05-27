import Papa from "papaparse";
import { ImportRow } from "./importTypes";
import { normalizeImportRowColumns } from "./normalizeColumns";

export async function parseCsvFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(
          (results.data as Record<string, unknown>[]).map(normalizeImportRowColumns)
        );
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
