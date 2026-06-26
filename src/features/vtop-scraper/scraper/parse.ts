import type { PlannerImportJSON, VtopCourse, VtopCourseOption } from "../types";
import type { VtopRawRow } from "./internal";
import { COURSE_CODE_RE } from "./internal";
import { detectCampus } from "./dom";

const LAB_SLOT_RE = /^L\d+(\+L\d+)*$/;

export function classifySlot(slot: string): "theory" | "lab" | "unknown" {
  const s = slot.replace(/\s+/g, "").toUpperCase();
  if (!s) return "unknown";
  if (LAB_SLOT_RE.test(s)) return "lab";
  if (s === "NIL" || /^[A-G]\d(\+T[A-G]{1,2}\d)*$/.test(s) || /^T[A-G]{1,2}\d$/.test(s)) {
    return "theory";
  }
  return "unknown";
}

function getTheoryTime(t: string): "Morning" | "Afternoon" | null {
  const tok = t.split("+")[0];
  const m = /(\d)$/.exec(tok);
  if (!m) return null;
  return m[1] === "1" ? "Morning" : "Afternoon";
}

function theoryCredits(t: string): number {
  if (t.toUpperCase() === "NIL") return 0;
  let total = 0;
  for (const part of t.split("+")) {
    const p = part.trim();
    if (/^[A-Za-z]\d$/.test(p)) total += 2;
    else if (/^T/.test(p)) total += 1;
  }
  return total;
}

function getLabTime(l: string): "Morning" | "Afternoon" | null {
  const m = /L(\d+)/.exec(l.split("+")[0]);
  if (!m) return null;
  return Number(m[1]) >= 31 ? "Morning" : "Afternoon";
}

function labPairs(l: string): number {
  const toks = l.split("+").filter(Boolean);
  return Math.floor(toks.length / 2);
}

function pairProfessorSlots(
  professorName: string,
  theoryList: string[],
  labList: string[]
): VtopCourseOption[] {
  const out: VtopCourseOption[] = [];
  const mk = (theory: string | null, lab: string | null, credits: number): VtopCourseOption => ({
    professorName,
    theorySlots: theory ? theory.split("+") : [],
    labSlots: lab ? [lab] : [],
    credits,
    program: null,
    notes: "",
  });

  if (theoryList.length === 0 && labList.length === 0) return out;

  if (theoryList.length > 0 && labList.length > 0) {
    for (const t of theoryList) {
      if (t.toUpperCase() === "NIL") {
        out.push(mk(t, null, theoryCredits(t)));
        continue;
      }
      const ttime = getTheoryTime(t);
      const matched = labList.filter((l) => getLabTime(l) === ttime);
      if (matched.length > 0) {
        for (const l of matched) out.push(mk(t, l, theoryCredits(t) + labPairs(l)));
      } else {
        out.push(mk(t, null, theoryCredits(t)));
      }
    }
  } else if (theoryList.length > 0) {
    for (const t of theoryList) out.push(mk(t, null, theoryCredits(t)));
  } else {
    for (const l of labList) out.push(mk(null, l, labPairs(l)));
  }
  return out;
}

export function buildCourses(rows: VtopRawRow[]): VtopCourse[] {
  type CourseAcc = { name: string; profs: Map<string, { theory: string[]; lab: string[] }> };
  const courses = new Map<string, CourseAcc>();

  for (const r of rows) {
    if (!r.courseCode || r.slotKind === "unknown") continue;
    if (!courses.has(r.courseCode)) {
      courses.set(r.courseCode, { name: r.courseName || r.courseCode, profs: new Map() });
    }
    const acc = courses.get(r.courseCode)!;
    if (r.courseName && (!acc.name || acc.name === r.courseCode)) acc.name = r.courseName;
    if (!acc.profs.has(r.professorName)) {
      acc.profs.set(r.professorName, { theory: [], lab: [] });
    }
    const profAcc = acc.profs.get(r.professorName)!;
    const slot = r.slot.replace(/\s+/g, "").toUpperCase();
    if (r.slotKind === "theory" && !profAcc.theory.includes(slot)) profAcc.theory.push(slot);
    if (r.slotKind === "lab" && !profAcc.lab.includes(slot)) profAcc.lab.push(slot);
  }

  const result: VtopCourse[] = [];
  for (const [courseCode, acc] of courses) {
    const options: VtopCourseOption[] = [];
    for (const [profName, slots] of acc.profs) {
      options.push(...pairProfessorSlots(profName, slots.theory, slots.lab));
    }
    if (options.length === 0) continue;
    const counts = new Map<number, number>();
    for (const o of options) counts.set(o.credits, (counts.get(o.credits) ?? 0) + 1);
    let credits = 0;
    let best = -1;
    for (const [c, n] of counts) {
      if (n > best) {
        best = n;
        credits = c;
      }
    }
    result.push({ courseCode, courseName: acc.name, credits, options });
  }
  return result;
}

export function optionDedupKey(courseCode: string, option: VtopCourseOption): string {
  const theory = [...option.theorySlots].sort().join("+");
  const lab = [...option.labSlots].sort().join("+");
  return `${courseCode}|${option.professorName}|${theory}|${lab}`;
}

export function dedupeCourseOptions(courses: VtopCourse[]): { courses: VtopCourse[]; duplicateCount: number } {
  let duplicateCount = 0;
  const deduped: VtopCourse[] = [];

  for (const course of courses) {
    const seen = new Set<string>();
    const unique: VtopCourseOption[] = [];
    for (const opt of course.options) {
      const key = optionDedupKey(course.courseCode, opt);
      if (seen.has(key)) {
        duplicateCount++;
        continue;
      }
      seen.add(key);
      unique.push(opt);
    }
    if (unique.length > 0) {
      deduped.push({ ...course, options: unique });
    }
  }

  return { courses: deduped, duplicateCount };
}

export function aggregateRows(domRows: VtopRawRow[]): PlannerImportJSON {
  const { courses, duplicateCount: _dup } = dedupeCourseOptions(buildCourses(domRows));

  const facultySet = new Map<string, { name: string }>();
  for (const c of courses) {
    for (const o of c.options) {
      facultySet.set(o.professorName.toLowerCase(), { name: o.professorName });
    }
  }

  return {
    campus: detectCampus(),
    semesterLabel: "",
    courses,
    slots: [],
    faculty: Array.from(facultySet.values()),
    capturedAt: new Date().toISOString(),
    source: "dom",
  };
}

export function extractRowsFromTable(
  table: HTMLTableElement,
  courseCode: string,
  courseName: string
): VtopRawRow[] {
  const rows: VtopRawRow[] = [];
  const trs = table.querySelectorAll("tr");
  if (trs.length < 2) return rows;

  const headers = Array.from(trs[0].querySelectorAll("th, td")).map(
    (h) => h.textContent?.trim().toLowerCase() ?? ""
  );
  const findCol = (re: RegExp) => headers.findIndex((h) => re.test(h));

  const slotCol = findCol(/^slot/);
  const facultyCol = findCol(/^faculty|^professor/);
  const codeCol = findCol(/course\s*code|^code$/);
  const nameCol = findCol(/course\s*name|^name$/);
  const notesCol = findCol(/note|remark/);
  const mergedCol = headers.findIndex((h) => /code.*name|code.*course/.test(h));

  if (slotCol === -1 || facultyCol === -1) return rows;

  for (let r = 1; r < trs.length; r++) {
    const cells = trs[r].querySelectorAll("td, th");
    if (cells.length < 2) continue;
    const cellText = (i: number) =>
      i >= 0 && i < cells.length ? cells[i]?.textContent?.trim() ?? "" : "";

    let code = courseCode;
    if (codeCol >= 0) {
      code = cellText(codeCol).match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/)?.[1]?.toUpperCase() ?? code;
    }
    if (!code && mergedCol >= 0) {
      code =
        cellText(mergedCol).match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/)?.[1]?.toUpperCase() ?? code;
    }
    if (!code) continue;

    let name = courseName || code;
    if (nameCol >= 0 && cellText(nameCol)) name = cellText(nameCol);
    if (mergedCol >= 0) {
      const mergedName =
        cellText(mergedCol).match(COURSE_CODE_RE)?.[2]?.trim() ?? "";
      if (mergedName) name = mergedName;
    }

    const professorName = cellText(facultyCol).replace(/\s+/g, " ").trim();
    const slot = cellText(slotCol).replace(/\s+/g, "").toUpperCase();
    if (!professorName || !slot) continue;

    rows.push({
      courseCode: code,
      courseName: name,
      professorName,
      slot,
      slotKind: classifySlot(slot),
    });

    void notesCol;
  }

  return rows;
}

export function scanPageDom(): VtopRawRow[] {
  const rows: VtopRawRow[] = [];
  const courseLookup = new Map<string, string>();
  let selectedCourseCode = "";
  let selectedCourseName = "";

  for (const select of document.querySelectorAll("select")) {
    const opts = select.querySelectorAll("option");
    if (opts.length < 2) continue;
    for (const opt of opts) {
      const text = opt.textContent?.trim() ?? "";
      const m = text.match(COURSE_CODE_RE);
      if (m) {
        courseLookup.set(m[1].toUpperCase(), m[2].trim());
        if ((opt as HTMLOptionElement).selected) {
          selectedCourseCode = m[1].toUpperCase();
          selectedCourseName = m[2].trim();
        }
      }
    }
  }

  for (const table of document.querySelectorAll("table")) {
    const tableRows = extractRowsFromTable(
      table,
      selectedCourseCode,
      selectedCourseName || courseLookup.get(selectedCourseCode) || selectedCourseCode
    );
    rows.push(...tableRows);
  }

  return rows;
}
