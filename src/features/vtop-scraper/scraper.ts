/**
 * VTOP scraper — public API and backward-compatible re-exports.
 */
export { detectCampus, isVtopDomain } from "./scraper/dom";
export { detectPage, isCourseRegistrationPage } from "./scraper/detectPage";
export { aggregateRows, buildCourses, scanPageDom } from "./scraper/parse";
export { runAutomatedScrape } from "./scraper/runAutomatedScrape";
export { uploadResults } from "./scraper/uploadResults";
export type { FailedCourseEntry, ScrapeProgress } from "./scraper/internal";

import { aggregateRows, scanPageDom } from "./scraper/parse";
import type { PlannerImportJSON } from "./types";

/** Read currently visible VTOP allocation table and produce planner-ready JSON. */
export function scrapeVTOP(): PlannerImportJSON {
  const domRows = scanPageDom();
  return aggregateRows(domRows);
}
