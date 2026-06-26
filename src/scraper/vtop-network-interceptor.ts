/**
 * VTOP Content Script — FFCS Scraper
 *
 * Captures professor × slot rows for each course from VTOP (via DOM table
 * parsing and network interception), then pairs theory/lab slots using the
 * same time-of-day + credit rules as the FFCS Planner engine, producing
 * output that matches `VtopCourse` / `VtopCourseOption` directly — no manual
 * reshaping needed on the planner side.
 */

// ─── Types ─────────────────────────────────────────────────────────

/** One row as seen on VTOP: one professor, one slot string (theory OR lab). */
interface VtopRawRow {
  courseCode: string;
  courseName: string;
  professorName: string;
  slot: string;
  slotKind: "theory" | "lab" | "unknown";
}

interface VtopCourseOption {
  professorName: string;
  theorySlots: string[];
  labSlots: string[];
  credits: number;
  program: string | null;
  notes: string;
}

interface VtopCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  options: VtopCourseOption[];
}

interface VtopScrapeResult {
  campus: string;
  semesterLabel: string;
  courses: VtopCourse[];
  slots: unknown[];
  faculty: { name: string }[];
  capturedAt: string;
  urls: string[];
  source: "dom" | "network" | "mixed";
}

// ─── STATE ──────────────────────────────────────────────────────────

let capturedRows: VtopRawRow[] = [];
let domRowsCache: VtopRawRow[] = [];
const capturedUrls = new Set<string>();
const seenNetworkBodies = new Set<string>();

// ─── CAMPUS DETECTION ──────────────────────────────────────────────

function detectCampus(): string {
  const host = window.location.hostname;
  if (host.includes("vitap")) return "ap";
  if (host.includes("vitbhopal")) return "bhopal";
  if (host.startsWith("vtopcc")) return "chennai";
  if (host.includes("vit.ac.in")) return "vellore";
  return "unknown";
}

function isVtopDomain(): boolean {
  return /vtop.*vit\.ac\.in|vtop.*vitap\.ac\.in|vtop.*vitbhopal\.ac\.in/.test(window.location.hostname);
}

// ─── SLOT CLASSIFICATION ────────────────────────────────────────────

const LAB_SLOT_RE = /^L\d+(\+L\d+)*$/;

function classifySlot(slot: string): "theory" | "lab" | "unknown" {
  const s = slot.replace(/\s+/g, "").toUpperCase();
  if (!s) return "unknown";
  if (LAB_SLOT_RE.test(s)) return "lab";
  if (s === "NIL" || /^[A-G]\d(\+T[A-G]{1,2}\d)*$/.test(s) || /^T[A-G]{1,2}\d$/.test(s)) return "theory";
  return "unknown";
}

// ─── PAIRING ENGINE (same rules as the FFCS CSV pairing pipeline) ──

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

/** Pairs one professor's theory/lab slot lists into VtopCourseOption rows. */
function pairProfessorSlots(professorName: string, theoryList: string[], labList: string[]): VtopCourseOption[] {
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

/** Groups raw rows by course, then by professor, then pairs slots per professor. */
function buildCourses(rows: VtopRawRow[]): VtopCourse[] {
  type CourseAcc = { name: string; profs: Map<string, { theory: string[]; lab: string[] }> };
  const courses = new Map<string, CourseAcc>();

  for (const r of rows) {
    if (!r.courseCode || r.slotKind === "unknown") continue;
    if (!courses.has(r.courseCode)) courses.set(r.courseCode, { name: r.courseName || r.courseCode, profs: new Map() });
    const acc = courses.get(r.courseCode)!;
    if (r.courseName && (!acc.name || acc.name === r.courseCode)) acc.name = r.courseName;
    if (!acc.profs.has(r.professorName)) acc.profs.set(r.professorName, { theory: [], lab: [] });
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
    // Course-level credits: the most common credit value across its options.
    const counts = new Map<number, number>();
    for (const o of options) counts.set(o.credits, (counts.get(o.credits) ?? 0) + 1);
    let credits = 0;
    let best = -1;
    for (const [c, n] of counts) if (n > best) { best = n; credits = c; }
    result.push({ courseCode, courseName: acc.name, credits, options });
  }
  return result;
}

// ─── DOM PARSING ───────────────────────────────────────────────────
//
// Targets VTOP's "Course Allocation Details" / faculty-allotment table:
// columns are some arrangement of Course Code, Course Name/Type, Faculty,
// Slot, Venue. We match by header text rather than fixed positions since
// column order varies slightly across VTOP deployments.

function scanPageDom(): VtopRawRow[] {
  const rows: VtopRawRow[] = [];

  // Course code → name lookup, built from <select> options (the course
  // dropdown reliably contains "CODE - Name" pairs on the allocation page).
  const courseLookup = new Map<string, string>();
  let selectedCourseCode = "";
  for (const select of document.querySelectorAll("select")) {
    const opts = select.querySelectorAll("option");
    if (opts.length < 2) continue;
    for (const opt of opts) {
      const text = opt.textContent?.trim() ?? "";
      const m = text.match(/([A-Z]{2,6}\d{3,6}[A-Z]?)\s*[-–—]\s*(.+)/);
      if (m) {
        courseLookup.set(m[1].toUpperCase(), m[2].trim());
        if ((opt as HTMLOptionElement).selected) selectedCourseCode = m[1].toUpperCase();
      }
    }
  }

  for (const table of document.querySelectorAll("table")) {
    const trs = table.querySelectorAll("tr");
    if (trs.length < 2) continue;

    const headers = Array.from(trs[0].querySelectorAll("th, td")).map((h) => h.textContent?.trim().toLowerCase() ?? "");
    const findCol = (re: RegExp) => headers.findIndex((h) => re.test(h));

    const slotCol = findCol(/^slot/);
    const facultyCol = findCol(/^faculty|^professor/);
    const codeCol = findCol(/course\s*code|^code$/);
    const nameCol = findCol(/course\s*name|^name$/);
    const mergedCol = headers.findIndex((h) => /code.*name|code.*course/.test(h));

    // Skip tables that clearly aren't the allocation table.
    if (slotCol === -1 || facultyCol === -1) continue;

    for (let r = 1; r < trs.length; r++) {
      const cells = trs[r].querySelectorAll("td, th");
      if (cells.length < 2) continue;
      const cellText = (i: number) => (i >= 0 && i < cells.length ? cells[i]?.textContent?.trim() ?? "" : "");

      let code = "";
      if (codeCol >= 0) code = cellText(codeCol).match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/)?.[1]?.toUpperCase() ?? "";
      if (!code && mergedCol >= 0) code = cellText(mergedCol).match(/([A-Z]{2,6}\d{3,6}[A-Z]?)/)?.[1]?.toUpperCase() ?? "";
      if (!code) code = selectedCourseCode;
      if (!code) continue;

      let name = nameCol >= 0 ? cellText(nameCol) : "";
      if (!name && mergedCol >= 0) name = cellText(mergedCol).match(/[A-Z]{2,6}\d{3,6}[A-Z]?\s*[-–—]\s*(.+)/)?.[1]?.trim() ?? "";
      if (!name) name = courseLookup.get(code) ?? code;

      const professorName = cellText(facultyCol).replace(/\s+/g, " ").trim();
      const slot = cellText(slotCol).replace(/\s+/g, "").toUpperCase();
      if (!professorName || !slot) continue;

      rows.push({ courseCode: code, courseName: name, professorName, slot, slotKind: classifySlot(slot) });
    }
  }

  return rows;
}

// ─── NETWORK INTERCEPTION ──────────────────────────────────────────

const INJECTED_SCRIPT_CODE = `
(function() {
  if (window.__ffcsInterceptorInstalled) return;
  window.__ffcsInterceptorInstalled = true;

  function trySend(data) {
    try { window.postMessage({ type: 'FFCS_SCRAPE', data: JSON.stringify(data) }, '*'); }
    catch(e) {}
  }

  trySend({ url: '/__ffcs_heartbeat', body: JSON.stringify({ alive: true }), contentType: 'text/plain' });

  function isCourseEndpoint(url) {
    var lower = url.toLowerCase();
    if (/\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)(\\?|$)/i.test(url)) return false;
    return lower.includes('/vtop/');
  }

  const origFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const response = await origFetch(input, init);
    if (isCourseEndpoint(url)) {
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('image') && !ct.includes('font') && !ct.includes('octet')) {
        const cloned = response.clone();
        cloned.text().then(function(body) {
          if (body && body.length > 30) trySend({ url, body, contentType: ct });
        }).catch(function(){});
      }
    }
    return response;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  var xhrMap = new WeakMap();
  XMLHttpRequest.prototype.open = function(method, url) {
    xhrMap.set(this, { url: url.toString(), method: method });
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    var meta = xhrMap.get(this);
    var xhr = this;
    if (meta && isCourseEndpoint(meta.url)) {
      var origReady = xhr.onreadystatechange;
      xhr.onreadystatechange = function(ev) {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var body = xhr.responseText;
          if (body && body.length > 30) {
            trySend({ url: meta.url, body: body, contentType: xhr.getResponseHeader('content-type') || '' });
          }
        }
        if (origReady) return origReady.call(xhr, ev);
        return undefined;
      };
    }
    return origSend.apply(xhr, arguments);
  };
})();
`;

function injectMainWorldScript() {
  const script = document.createElement("script");
  script.textContent = INJECTED_SCRIPT_CODE;
  script.id = "ffcs-interceptor-script";
  (document.head || document.documentElement).appendChild(script);
}

function setupMessageListener() {
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window || event.data?.type !== "FFCS_SCRAPE") return;
    try {
      const raw = JSON.parse(event.data.data);
      const url = String(raw.url ?? "");
      const body = String(raw.body ?? "");
      if (url === "/__ffcs_heartbeat") {
        addLog("✅ Network interceptor active", "hit");
        return;
      }
      if (!url || !body || seenNetworkBodies.has(body)) return;
      seenNetworkBodies.add(body);
      capturedUrls.add(url);

      const extracted = extractRowsFromJson(body);
      let added = 0;
      for (const row of extracted) {
        if (!capturedRows.some((x) => x.courseCode === row.courseCode && x.professorName === row.professorName && x.slot === row.slot)) {
          capturedRows.push(row);
          added++;
        }
      }
      if (added > 0) {
        addLog(`📡 ${url.slice(url.lastIndexOf("/") + 1)} → ${added} new rows`, "hit");
        updateUI();
      }
    } catch {}
  });
}

function extractRowsFromJson(body: string): VtopRawRow[] {
  const rows: VtopRawRow[] = [];
  try {
    const data = JSON.parse(body);
    (function scan(obj: unknown) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item && typeof item === "object") {
            const o = item as Record<string, unknown>;
            const code = extractStr(o, ["courseCode", "course_code", "coursecode", "code", "subjectCode", "subject_code"]);
            if (code) {
              const name = extractStr(o, ["courseName", "course_name", "coursename", "title", "subjectName"]) || code;
              const professorName = extractStr(o, ["professorName", "professor", "faculty_name", "facultyName", "faculty", "instructor", "teacher", "staffName"]);
              const slot = extractStr(o, ["slot", "slots", "slotId", "slot_id", "theorySlots", "theory_slots", "labSlots"]).replace(/\s+/g, "").toUpperCase();
              if (professorName && slot) {
                rows.push({ courseCode: code.toUpperCase(), courseName: name, professorName, slot, slotKind: classifySlot(slot) });
              }
            }
            scan(o);
          }
        }
      } else {
        for (const val of Object.values(obj as Record<string, unknown>)) scan(val);
      }
    })(data);
  } catch {}
  return rows;
}

function extractStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (val !== null && val !== undefined && val !== "") return String(val).trim();
  }
  return "";
}

// ─── AGGREGATION ────────────────────────────────────────────────────

function aggregateResults(): VtopScrapeResult {
  domRowsCache = scanPageDom();
  const allRows = [...domRowsCache, ...capturedRows];
  const courses = buildCourses(allRows);

  const facultySet = new Map<string, { name: string }>();
  for (const c of courses) for (const o of c.options) facultySet.set(o.professorName.toLowerCase(), { name: o.professorName });

  return {
    campus: detectCampus(),
    semesterLabel: "",
    courses,
    slots: [],
    faculty: Array.from(facultySet.values()),
    capturedAt: new Date().toISOString(),
    urls: Array.from(capturedUrls),
    source: capturedRows.length > 0 && domRowsCache.length > 0 ? "mixed" : capturedRows.length > 0 ? "network" : "dom",
  };
}

// ─── EXPORT FORMATS ─────────────────────────────────────────────────

function coursesToFlatCsv(courses: VtopCourse[]): string {
  const lines = ["course_code,course_name,professor_name,theory_slot,lab_slot,credits"];
  for (const c of courses) {
    for (const o of c.options) {
      const theory = o.theorySlots.length ? o.theorySlots.join("+") : "N/A";
      const lab = o.labSlots.length ? o.labSlots.join("+") : "N/A";
      lines.push([c.courseCode, c.courseName, o.professorName, theory, lab, String(o.credits)].map(csvEsc).join(","));
    }
  }
  return lines.join("\n");
}

function csvEsc(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── AUTO-FEED TO PLANNER ───────────────────────────────────────────
//
// Two delivery paths, tried in order:
//  1. BroadcastChannel — if the planner is already open in another tab in
//     this browser, it can subscribe to "ffcs-vtop-import" and receive the
//     payload instantly, no page reload needed.
//  2. New tab with the payload in the URL — used as a fallback so the flow
//     still works the first time, before the planner tab exists.

const PLANNER_URL = "https://ffcsmaker.vercel.app/planner";
const IMPORT_CHANNEL = "ffcs-vtop-import";

function sendToPlanner(result: VtopScrapeResult): { delivered: "broadcast" | "newtab"; count: number } {
  const payload = { campus: result.campus, semesterLabel: result.semesterLabel, courses: result.courses, capturedAt: result.capturedAt };
  try {
    const bc = new BroadcastChannel(IMPORT_CHANNEL);
    bc.postMessage({ type: "FFCS_VTOP_IMPORT", payload });
    bc.close();
  } catch {
    // BroadcastChannel unsupported — fall through to new-tab delivery only.
  }
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  window.open(`${PLANNER_URL}?vtopImport=${encoded}`, "_blank");
  return { delivered: "newtab", count: result.courses.length };
}

// ─── UI OVERLAY ─────────────────────────────────────────────────────

function createOverlay(): HTMLDivElement {
  const existing = document.getElementById("ffcs-scraper-panel");
  if (existing) return existing as HTMLDivElement;

  const overlay = document.createElement("div");
  overlay.id = "ffcs-scraper-panel";
  overlay.innerHTML = `
    <style>
      #ffcs-scraper-panel {
        all: initial;
        position: fixed !important; top: 12px !important; right: 12px !important;
        z-index: 2147483647 !important; width: 420px !important; max-height: 90vh !important;
        overflow-y: auto !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 13px !important; color: #f8fafc !important; background: #111827 !important;
        border: 1px solid #243041 !important; border-radius: 12px !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important; padding: 0 !important; line-height: 1.5 !important;
      }
      #ffcs-scraper-panel * { box-sizing: border-box !important; margin: 0 !important; }
      .ffcs-header {
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        padding: 12px 16px !important; background: #1e293b !important;
        border-bottom: 1px solid #243041 !important; border-radius: 12px 12px 0 0 !important;
        font-weight: 600 !important; font-size: 14px !important;
      }
      .ffcs-header-title { display: flex !important; align-items: center !important; gap: 8px !important; }
      .ffcs-badge { font-size: 10px !important; padding: 2px 8px !important; border-radius: 99px !important; font-weight: 700 !important; }
      .ffcs-badge-active { background: #038433 !important; color: #ffffff !important; }
      .ffcs-close {
        background: none !important; border: none !important; color: #94a3b8 !important;
        cursor: pointer !important; font-size: 18px !important; padding: 0 4px !important; line-height: 1 !important;
      }
      .ffcs-close:hover { color: #f8fafc !important; }
      .ffcs-body { padding: 12px 16px !important; }
      .ffcs-section-title {
        font-size: 11px !important; font-weight: 600 !important; color: #64748b !important;
        text-transform: uppercase !important; letter-spacing: 0.5px !important; margin: 10px 0 6px !important;
      }
      .ffcs-stat { display: flex !important; justify-content: space-between !important; padding: 5px 0 !important; border-bottom: 1px solid #1f2937 !important; font-size: 12px !important; }
      .ffcs-stat-label { color: #94a3b8 !important; }
      .ffcs-stat-value { color: #f8fafc !important; font-weight: 500 !important; }
      .ffcs-actions { display: flex !important; gap: 6px !important; margin-top: 8px !important; flex-wrap: wrap !important; }
      .ffcs-btn {
        flex: 1 !important; min-width: 70px !important; padding: 7px 10px !important; border: none !important;
        border-radius: 6px !important; font-size: 11px !important; font-weight: 600 !important;
        cursor: pointer !important; transition: all 0.15s !important; text-align: center !important;
      }
      .ffcs-btn-primary { background: #038433 !important; color: white !important; }
      .ffcs-btn-primary:hover { background: #04963a !important; }
      .ffcs-btn-danger { background: #ef4444 !important; color: white !important; }
      .ffcs-btn-danger:hover { background: #dc2626 !important; }
      .ffcs-btn-secondary { background: #1f2937 !important; color: #cbd5e1 !important; }
      .ffcs-btn-secondary:hover { background: #374151 !important; }
      .ffcs-btn-send { background: #038433 !important; color: white !important; font-size: 12px !important; }
      .ffcs-btn-send:hover { background: #04963a !important; }
      .ffcs-log {
        margin-top: 10px !important; max-height: 130px !important; overflow-y: auto !important;
        background: #0b0f14 !important; border-radius: 6px !important; padding: 6px 8px !important;
        font-family: 'Courier New', monospace !important; font-size: 10px !important; line-height: 1.6 !important;
      }
      .ffcs-log-entry { color: #64748b !important; }
      .ffcs-log-entry.hit { color: #038433 !important; }
      .ffcs-log-entry.error { color: #ef4444 !important; }
      .ffcs-course-item { padding: 4px 8px !important; margin: 2px 0 !important; background: #1f2937 !important; border-radius: 4px !important; font-size: 11px !important; line-height: 1.5 !important; }
      .ffcs-course-code { color: #038433 !important; font-weight: 600 !important; }
      .ffcs-course-name { color: #94a3b8 !important; }
      .ffcs-slot-tag { color: #f59e0b !important; font-family: monospace !important; }
    </style>
    <div class="ffcs-header">
      <div class="ffcs-header-title">
        🎓 FFCS Scraper
        <span class="ffcs-badge ffcs-badge-active" id="ffcs-badge">ACTIVE</span>
      </div>
      <button class="ffcs-close" id="ffcs-close-btn">✕</button>
    </div>
    <div class="ffcs-body">
      <div class="ffcs-section-title">Stats</div>
      <div class="ffcs-stat"><span class="ffcs-stat-label">Courses</span><span class="ffcs-stat-value" id="ffcs-course-count">0</span></div>
      <div class="ffcs-stat"><span class="ffcs-stat-label">Faculty options</span><span class="ffcs-stat-value" id="ffcs-option-count">0</span></div>
      <div class="ffcs-stat"><span class="ffcs-stat-label">Faculty (unique)</span><span class="ffcs-stat-value" id="ffcs-faculty-count">0</span></div>
      <div class="ffcs-stat"><span class="ffcs-stat-label">Campus</span><span class="ffcs-stat-value" id="ffcs-campus">${detectCampus()}</span></div>

      <div class="ffcs-actions" style="margin-top:10px;">
        <button class="ffcs-btn ffcs-btn-send" id="ffcs-scan-btn" style="flex:1;padding:8px 12px;font-size:12px">🔍 Scan Page</button>
      </div>
      <div class="ffcs-actions">
        <button class="ffcs-btn ffcs-btn-send" id="ffcs-send-planner" style="flex:2;padding:8px 12px">📤 Send to FFCS Planner</button>
      </div>
      <div class="ffcs-actions">
        <button class="ffcs-btn ffcs-btn-primary" id="ffcs-export-json">Export JSON</button>
        <button class="ffcs-btn ffcs-btn-secondary" id="ffcs-export-csv">Export CSV</button>
        <button class="ffcs-btn ffcs-btn-danger" id="ffcs-clear-btn">Clear</button>
      </div>

      <div class="ffcs-section-title">Courses (paired theory × lab)</div>
      <div id="ffcs-list"><div style="color:#64748b;font-size:11px;">Click "Scan Page" to extract data.</div></div>

      <div class="ffcs-log" id="ffcs-log">
        <div class="ffcs-log-entry">Loaded on ${detectCampus()}. Ready.</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay as HTMLDivElement;
}

function setupOverlayEvents(overlay: HTMLDivElement) {
  overlay.querySelector("#ffcs-close-btn")?.addEventListener("click", () => overlay.remove());

  overlay.querySelector("#ffcs-scan-btn")?.addEventListener("click", () => {
    addLog("🔍 Scanning page...", "hit");
    const result = aggregateResults();
    updateUI();
    const optionCount = result.courses.reduce((n, c) => n + c.options.length, 0);
    addLog(`✅ ${result.courses.length} courses, ${optionCount} faculty options, ${result.faculty.length} faculty`, "hit");
    if (result.courses.length === 0) {
      addLog(`💡 Navigate to "Course Allocation Details" / "Faculty Allotment"`, "miss");
    }
  });

  overlay.querySelector("#ffcs-send-planner")?.addEventListener("click", () => {
    const result = aggregateResults();
    if (result.courses.length === 0) {
      addLog("⚠️ No data to send — scan the page first!", "error");
      return;
    }
    try {
      const { count } = sendToPlanner(result);
      addLog(`📤 Sent ${count} courses to FFCS Planner (broadcast + new tab)`, "hit");
    } catch (e) {
      addLog(`⚠️ Failed to send: ${e}`, "error");
    }
  });

  overlay.querySelector("#ffcs-export-json")?.addEventListener("click", () => {
    const result = aggregateResults();
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    downloadBlob(blob, `vtop-courses-${Date.now()}.json`);
    addLog(`Exported JSON (${result.courses.length} courses)`, "hit");
  });

  overlay.querySelector("#ffcs-export-csv")?.addEventListener("click", () => {
    const result = aggregateResults();
    const csv = coursesToFlatCsv(result.courses);
    downloadBlob(new Blob([csv], { type: "text/csv" }), `vtop-courses-${Date.now()}.csv`);
    addLog(`Exported CSV (${result.courses.length} courses)`, "hit");
  });

  overlay.querySelector("#ffcs-clear-btn")?.addEventListener("click", () => {
    capturedRows = [];
    domRowsCache = [];
    capturedUrls.clear();
    seenNetworkBodies.clear();
    updateUI();
    addLog("Cleared all cached data", "miss");
  });
}

function addLog(message: string, type: "hit" | "miss" | "error" = "miss") {
  const logEl = document.getElementById("ffcs-log");
  if (!logEl) return;
  const entry = document.createElement("div");
  entry.className = `ffcs-log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function updateUI() {
  const result = aggregateResults();
  const optionCount = result.courses.reduce((n, c) => n + c.options.length, 0);
  setText("#ffcs-course-count", String(result.courses.length));
  setText("#ffcs-option-count", String(optionCount));
  setText("#ffcs-faculty-count", String(result.faculty.length));
  setText("#ffcs-campus", result.campus);

  const list = document.getElementById("ffcs-list");
  if (!list) return;
  list.innerHTML = "";

  if (result.courses.length === 0) {
    list.innerHTML = `<div style="color:#64748b;font-size:11px;">Click "Scan Page" to extract data.</div>`;
    return;
  }

  let shown = 0;
  for (const c of result.courses) {
    for (const o of c.options) {
      if (shown >= 60) break;
      shown++;
      const theory = o.theorySlots.length ? o.theorySlots.join("+") : "N/A";
      const lab = o.labSlots.length ? o.labSlots.join("+") : "N/A";
      const item = document.createElement("div");
      item.className = "ffcs-course-item";
      item.innerHTML = `
        <span class="ffcs-course-code">${c.courseCode}</span>
        <span class="ffcs-course-name">${c.courseName}</span>
        <span class="ffcs-slot-tag">[${theory} / ${lab}]</span>
        <span style="color:#64748b;font-size:10px"> ${o.credits}cr</span>
        <br><span style="margin-left:4px;color:#a78bfa">→ ${o.professorName}</span>
      `;
      list.appendChild(item);
    }
    if (shown >= 60) break;
  }
  const total = result.courses.reduce((n, c) => n + c.options.length, 0);
  if (total > 60) {
    const more = document.createElement("div");
    more.style.cssText = "color:#64748b;font-size:10px;margin-top:4px";
    more.textContent = `+ ${total - 60} more`;
    list.appendChild(more);
  }
}

function setText(selector: string, text: string) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

// ─── EXTENSION MESSAGE HANDLER ────────────────────────────────────

function handleExtensionMessage(
  message: { type: string; format?: string },
  _sender: unknown,
  sendResponse: (response?: unknown) => void
) {
  switch (message.type) {
    case "FFCS_SCRAPER_GET_DATA": {
      const result = aggregateResults();
      sendResponse({
        courses: result.courses.length,
        faculty: result.faculty.length,
        requests: result.urls.length,
        campus: result.campus,
        active: true,
        source: result.source,
      });
      break;
    }
    case "FFCS_SCRAPER_EXPORT": {
      const result = aggregateResults();
      const ts = Date.now();
      if (message.format === "csv") {
        sendResponse({ data: coursesToFlatCsv(result.courses), filename: `vtop-courses-${ts}.csv` });
      } else {
        sendResponse({ data: JSON.stringify(result, null, 2), filename: `vtop-courses-${ts}.json` });
      }
      break;
    }
    case "FFCS_SCRAPER_SEND_TO_PLANNER": {
      const result = aggregateResults();
      try {
        const { count } = sendToPlanner(result);
        sendResponse({ ok: true, count });
      } catch (e) {
        sendResponse({ error: e instanceof Error ? e.message : String(e) });
      }
      break;
    }
    default:
      sendResponse({ error: `Unknown: ${message.type}` });
  }
}

try {
  chrome?.runtime?.onMessage?.addListener(handleExtensionMessage as unknown as (
    message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void
  ) => void);
} catch {}

(window as unknown as Record<string, unknown>).__ffcsScraper = {
  scanNow: () => { const r = aggregateResults(); updateUI(); return r; },
  getResults: aggregateResults,
  exportJson: () => JSON.stringify(aggregateResults(), null, 2),
  exportCsv: () => coursesToFlatCsv(aggregateResults().courses),
  sendToPlanner: () => sendToPlanner(aggregateResults()),
};

if (isVtopDomain()) {
  injectMainWorldScript();
  setupMessageListener();

  function setupUI() {
    const overlay = createOverlay();
    setupOverlayEvents(overlay);
    const badge = document.getElementById("ffcs-badge");
    if (badge) { badge.textContent = "ACTIVE"; badge.className = "ffcs-badge ffcs-badge-active"; }
    addLog(`✅ Loaded on ${detectCampus()}`, "hit");
    addLog(`💡 Click "Scan Page" to extract course data`, "miss");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupUI);
    setTimeout(setupUI, 1000);
  } else {
    setupUI();
  }
}
