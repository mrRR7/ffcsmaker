export interface VtopCourseOption {
  professorName: string;
  theorySlots: string[];
  labSlots: string[];
  credits: number;
  program: string | null;
  notes: string;
}

export interface VtopCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  options: VtopCourseOption[];
}

/** JSON schema consumed by the planner import pipeline. */
export interface PlannerImportJSON {
  campus: string;
  semesterLabel: string;
  courses: VtopCourse[];
  slots: unknown[];
  faculty: { name: string }[];
  capturedAt: string;
  urls?: string[];
  source?: "dom" | "network" | "mixed";
}

export const VTOP_IMPORT_PARAM = "vtopImport";
export const DEFAULT_PLANNER_URL = "https://ffcsmaker.vercel.app/planner";

export const VTOP_URLS = {
  vellore: "https://vtop.vit.ac.in/vtop/",
  chennai: "https://vtopcc.vit.ac.in/vtop/",
  ap: "https://vtop.vitap.ac.in/vtop/",
  bhopal: "https://vtop.vitbhopal.ac.in/vtop/",
} as const;

export function getVtopUrl(campus: keyof typeof VTOP_URLS | null | string) {
  if (campus && campus in VTOP_URLS) {
    return VTOP_URLS[campus as keyof typeof VTOP_URLS];
  }
  return VTOP_URLS.vellore;
}

export function getSupportedCampusKeys() {
  return Object.keys(VTOP_URLS) as (keyof typeof VTOP_URLS)[];
}
