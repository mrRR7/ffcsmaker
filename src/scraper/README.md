# FFCS VTOP Scraper

Browser extension that extracts course, faculty, and slot data from **VTOP course registration pages** by intercepting network traffic. Outputs data ready for the **FFCS Planner** engine.

## How It Works

```
VTOP Course Registration Page
        │
        ▼
Content Script (vtop-network-interceptor.ts)
  ├── Monkey-patches fetch() and XMLHttpRequest
  ├── Filters for course registration API responses
  ├── Parses JSON + HTML responses
  ├── Deduplicates courses by code, merges faculty options
  └── Exposes via:
      ├── Floating UI panel on VTOP page
      ├── chrome.runtime.onMessage (for popup)
      └── window.__ffcsScraper (for manual testing)
```

## Quick Start

### Load as Unpacked Extension (Chrome)

```bash
cd src/scraper
npm install
npm run build
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `src/scraper/dist/`

### Use it

1. Log in to **VTOP** (`vtop.vit.ac.in`, `vtopcc.vit.ac.in`, `vtop.vitap.ac.in`, or `vtop.vitbhopal.ac.in`)
2. Navigate to the **course registration** page (the page that lists available courses with faculty and slots)
3. A floating **FFCS Scraper** panel appears in the top-right corner showing live stats
4. Click the extension icon (🎓) to open the popup with export options

## What Gets Captured

| Data | Source | Example |
|---|---|---|
| Course code | Network JSON/HTML | `BCSE304L` |
| Course name | Network JSON/HTML | `Software Engineering` |
| Credits | Network JSON/HTML | `4` |
| Professor name | Network JSON/HTML | `Dr. R. Sharma` |
| Theory slots | Network JSON/HTML | `A1, B1, TC1` |
| Lab slots | Network JSON/HTML | `L1+L2` |
| Faculty list | `/faculty/all` endpoint (click button) | 2000+ entries |
| Campus | Auto-detected from URL | `vellore`, `chennai`, `ap`, `bhopal` |

## Output Format (JSON)

```json
{
  "campus": "vellore",
  "semesterLabel": "Fall 2025-26",
  "courses": [
    {
      "courseCode": "BCSE304L",
      "courseName": "Software Engineering",
      "credits": 4,
      "options": [
        {
          "professorName": "Dr. R. Sharma",
          "theorySlots": ["A1", "B1", "TC1"],
          "labSlots": ["L1+L2"],
          "program": null,
          "notes": ""
        }
      ]
    }
  ],
  "slots": [],
  "faculty": [],
  "capturedAt": "2026-06-26T10:30:00.000Z",
  "urls": ["https://vtop.vit.ac.in/vtop/..."],
  "courses": [...]
}
```

This directly maps to the `VtopCourse` / `VtopCourseOption` types and can be imported into the FFCS Planner via:
- The merge function `mergeCourseOptions()` in `src/features/courses/mergeCourseOptions.ts`
- Or the import pipeline in `src/features/import/`

## Architecture

```
src/scraper/
├── manifest.json                       # MV3 manifest
├── vtop-network-interceptor.ts         # Content script — network interception + data extraction + UI
├── background.ts                       # Service worker — storage, message relay
├── popup.html                          # Extension popup UI
├── popup.ts                            # Popup logic — talks to content script
├── package.json                        # Build deps
├── tsconfig.json                       # TypeScript config
└── README.md                           # This file
```

## Integration with FFCS Planner

The JSON/CSV output can be fed directly into the FFCS Maker's existing import pipeline:

1. **Export JSON** from the scraper popup or panel
2. **Import** via the FFCS Planner's CSV/JSON import feature
3. Or paste the faculty+slot data as text in the planner

The types align with:
- `src/engine/types.ts` — `Course`, `CourseOption`
- `src/types/db.ts` — `DBCourse`, `DBCourseOption`
- `src/features/courses/mergeCourseOptions.ts` — merges scraped data into planner state

## Notes

- **No authentication handling needed** — runs as a content script on your already-authenticated VTOP session
- **Faculty list** requires clicking the "Fetch All Faculty" button (uses the `/faculty/all` endpoint which may be unauthenticated on some campuses)
- **VTOP DOM changes** — the HTML parser uses flexible column header matching; if VTOP changes class names, the JSON interception path still works
- **Campus auto-detection** — works for Vellore, Chennai, AP, and Bhopal
