import { COURSE_CODE_RE } from "./internal";

export function isVtopDomain(): boolean {
  return /vtop.*vit\.ac\.in|vtop.*vitap\.ac\.in|vtop.*vitbhopal\.ac\.in/.test(
    window.location.hostname
  );
}

export function detectCampus(): string {
  const host = window.location.hostname;
  if (host.includes("vitap")) return "ap";
  if (host.includes("vitbhopal")) return "bhopal";
  if (host.startsWith("vtopcc")) return "chennai";
  if (host.includes("vit.ac.in")) return "vellore";
  return "unknown";
}

export function getMeaningfulSelects(): HTMLSelectElement[] {
  return Array.from(document.querySelectorAll("select")).filter((select) => {
    const opts = Array.from(select.options).filter(
      (o) => o.value && o.value !== "0" && o.value !== "-1" && o.value !== ""
    );
    return opts.length >= 2;
  });
}

export function countCourseCodeOptions(select: HTMLSelectElement): number {
  let count = 0;
  for (const opt of select.options) {
    const text = opt.textContent?.trim() ?? "";
    if (COURSE_CODE_RE.test(text) || COURSE_CODE_RE.test(opt.value)) count++;
  }
  return count;
}

export function findSelectByNearbyText(patterns: RegExp[]): HTMLSelectElement | null {
  const allText = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim();

  for (const pattern of patterns) {
    for (const el of document.querySelectorAll("label, th, td, span, div, p, b, strong")) {
      const text = allText(el);
      if (!text || text.length > 120 || !pattern.test(text)) continue;

      const forId = el.getAttribute("for");
      if (forId) {
        const linked = document.getElementById(forId);
        if (linked instanceof HTMLSelectElement) return linked;
      }

      const parent = el.closest("tr, .form-group, .row, fieldset, div");
      const inParent = parent?.querySelector("select");
      if (inParent instanceof HTMLSelectElement) return inParent;

      let sibling: Element | null = el.nextElementSibling;
      for (let i = 0; i < 3 && sibling; i++) {
        if (sibling instanceof HTMLSelectElement) return sibling;
        const nested = sibling.querySelector("select");
        if (nested instanceof HTMLSelectElement) return nested;
        sibling = sibling.nextElementSibling;
      }
    }
  }

  return null;
}

export function findCourseSelect(): HTMLSelectElement | null {
  const byLabel = findSelectByNearbyText([
    /course\s*list/i,
    /select\s*course/i,
    /course\s*name/i,
    /course\s*code/i,
  ]);
  if (byLabel && countCourseCodeOptions(byLabel) >= 1) return byLabel;

  let best: HTMLSelectElement | null = null;
  let bestCount = 0;
  for (const select of getMeaningfulSelects()) {
    const count = countCourseCodeOptions(select);
    if (count > bestCount) {
      bestCount = count;
      best = select;
    }
  }
  return bestCount >= 1 ? best : null;
}

export function findCurriculumSelect(courseSelect: HTMLSelectElement | null): HTMLSelectElement | null {
  const byLabel = findSelectByNearbyText([
    /curriculum\s*category/i,
    /course\s*category/i,
    /programme\s*category/i,
    /category/i,
  ]);
  if (byLabel && byLabel !== courseSelect) return byLabel;

  const selects = getMeaningfulSelects().filter((s) => s !== courseSelect);
  if (selects.length === 0) return null;

  let best: HTMLSelectElement | null = null;
  let bestScore = -1;
  for (const select of selects) {
    const courseLike = countCourseCodeOptions(select);
    const total = select.options.length;
    const score = total - courseLike * 3;
    if (score > bestScore) {
      bestScore = score;
      best = select;
    }
  }
  return best;
}

export function hasAllocationTable(): boolean {
  return findAllocationTable() !== null;
}

export function findAllocationTable(): HTMLTableElement | null {
  for (const table of document.querySelectorAll("table")) {
    const trs = table.querySelectorAll("tr");
    if (trs.length < 2) continue;

    const headers = Array.from(trs[0].querySelectorAll("th, td")).map(
      (h) => h.textContent?.trim().toLowerCase() ?? ""
    );
    const slotCol = headers.findIndex((h) => /^slot/.test(h));
    const facultyCol = headers.findIndex((h) => /^faculty|^professor/.test(h));
    if (slotCol >= 0 && facultyCol >= 0) return table;
  }
  return null;
}

export function getSelectOptionsFingerprint(select: HTMLSelectElement): string {
  return Array.from(select.options)
    .map((o) => `${o.value}\0${o.textContent?.trim() ?? ""}`)
    .join("\n");
}

export function dispatchSelectChange(select: HTMLSelectElement): void {
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

export function setSelectValue(select: HTMLSelectElement, value: string): void {
  select.value = value;
  dispatchSelectChange(select);
}

export function isPageLoading(): boolean {
  if (
    document.querySelector(
      '.glyphicon-refresh, .fa-spin, .fa-spinner, .spinner, [class*="loading"], [class*="loader"]'
    )
  ) {
    return true;
  }
  const bodyText = document.body?.innerText ?? "";
  if (/loading\.{0,3}/i.test(bodyText.slice(0, 5000))) {
    const visible = Array.from(document.querySelectorAll("*")).some((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const text = el.innerText?.trim() ?? "";
      if (!/^loading/i.test(text)) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    if (visible) return true;
  }
  return false;
}
