/** Internal scraper types — not part of the public PlannerImport schema. */

export interface VtopRawRow {
  courseCode: string;
  courseName: string;
  professorName: string;
  slot: string;
  slotKind: "theory" | "lab" | "unknown";
}

export interface CurriculumCategory {
  value: string;
  label: string;
}

export interface CourseEntry {
  value: string;
  code: string;
  name: string;
  label: string;
}

export interface FailedCourseEntry {
  category: CurriculumCategory;
  course: CourseEntry;
  error: string;
}

export type PageDetection =
  | {
      mode: "dropdown";
      curriculumSelect: HTMLSelectElement;
      courseSelect: HTMLSelectElement;
    }
  | { mode: "table" }
  | { mode: "none" };

export interface ScrapeProgress {
  phase: "scraping" | "uploading" | "complete" | "error";
  curriculumLabel: string;
  curriculumIndex: number;
  curriculumTotal: number;
  courseLabel: string;
  courseIndex: number;
  courseTotal: number;
  coursesCollected: number;
  optionsCollected: number;
  estimatedSecondsRemaining: number | null;
  failedCount: number;
  duplicateCount: number;
}

export interface AutomatedScrapeResult {
  rows: VtopRawRow[];
  failedCourses: FailedCourseEntry[];
  duplicateCount: number;
  totalCoursesAttempted: number;
}

export const COURSE_CODE_RE = /([A-Z]{2,6}\d{3,6}[A-Z]?)\s*[-–—]\s*(.+)/;
