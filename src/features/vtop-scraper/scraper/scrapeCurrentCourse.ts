import { findAllocationTable } from "./dom";
import { extractRowsFromTable } from "./parse";
import type { CourseEntry, VtopRawRow } from "./internal";

export function getAllocationSignature(rows: VtopRawRow[]): string {
  return rows.map((r) => `${r.professorName}|${r.slot}`).join(";");
}

export function scrapeCurrentCourse(course: CourseEntry): VtopRawRow[] {
  const table = findAllocationTable();
  if (!table) return [];
  return extractRowsFromTable(table, course.code, course.name);
}

export function scrapeVisibleAllocation(): VtopRawRow[] {
  const table = findAllocationTable();
  if (!table) return [];

  let code = "";
  let name = "";
  for (const select of document.querySelectorAll("select")) {
    for (const opt of select.options) {
      if (!(opt as HTMLOptionElement).selected) continue;
      const text = opt.textContent?.trim() ?? "";
      const m = text.match(/([A-Z]{2,6}\d{3,6}[A-Z]?)\s*[-–—]\s*(.+)/);
      if (m) {
        code = m[1].toUpperCase();
        name = m[2].trim();
        break;
      }
    }
    if (code) break;
  }

  return extractRowsFromTable(table, code, name || code);
}
