<div align="center">

<h1>Ultimate FFCS Planner</h1>

<p>Stop checking timetable combinations manually.<br/>Generate every valid FFCS combination automatically ranked, compared, and ready to register.</p>

[![Live](https://img.shields.io/badge/Live-ffcsmaker.vercel.app-blue?style=flat-square&logo=vercel)](https://ffcsmaker.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Visitors](https://visitor-badge.laobi.icu/badge?page_id=ffcsmaker.readme&style=flat-square)](https://ffcsmaker.vercel.app)

</div>

---

## What is FFCS?

FFCS (Fully Flexible Credit System) is VIT's biannual course registration system where students race to register for the best professor-slot combinations before they fill up — manually cross-checking hundreds of possible timetable arrangements. Ultimate FFCS Planner automates that entirely.

---

## Features

**Generation**
- Backtracking DFS with MRV heuristic finds every valid conflict-free combination across 10+ courses with multiple professor options
- Runs in a Web Worker so the UI stays responsive during search
- Multiple ranking profiles (Balanced, Compact, Free Days) score and sort results by gaps, end time, free days, and compactness
- Full constraint system: blocked windows, no-classes-after time, avoid first/last period, per-day end times, professor avoids/locks, max classes/day, max gap slots

**Course input — three paths**
- Catalog search against the live Supabase-backed semester catalog (program-scoped — AIML students see AIML options, CSE Core sees CSE Core)
- Smart paste parser handles WhatsApp-forwarded course lists in any text format
- CSV / XLSX import

**Results**
- Slot matrix timetable with color-coded courses and cell-level detail panels
- Side-by-side comparison of up to 3 timetables
- Zero-results diagnostic: names the specific courses or constraints responsible when no valid combination exists, with one-tap actions to fix it

**Export & share**
- PDF, PNG, iCal (weekly repeating events for Google/Apple/Outlook Calendar)
- Styled share card (1080×1080) for WhatsApp and Instagram status
- Persistent share links for course lists and specific timetables

**Multi-campus**
- VIT Chennai + VIT Vellore: full slot catalog (Mon–Fri)
- VIT AP: full slot catalog (Tue–Sat week, non-uniform lab durations of 90/100/110 min)
- VIT Bhopal: in progress

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + localStorage persistence |
| Database | Supabase (Postgres + RLS) |
| Generation | Web Worker (backtracking DFS) |
| Parsing | PapaParse, SheetJS, LZ-string |
| Export | html-to-image, jsPDF |
| Hosting | Vercel |

---

## Architecture

```
src/
├── app/                        # Next.js App Router
│   ├── planner/                # Step-based planner (mobile) / tabbed layout (desktop)
│   ├── results/                # Browse, export, share generated timetables
│   ├── compare/                # Side-by-side timetable comparison
│   ├── saved/                  # Saved timetable management
│   ├── timetable/[id]/         # Shared timetable view (public, no auth)
│   └── api/
│       ├── catalog/search/     # Program + campus scoped course search
│       ├── catalog/semesters/  # Active semester metadata
│       ├── share-timetable/    # Share link creation + resolution
│       └── admin/              # Bulk course upload, auth (developer only)
│
├── engine/
│   ├── generator.ts            # Backtracking DFS, MRV sort, constraint pruning
│   ├── conflict.ts             # Slot overlap detection, hard constraint checks
│   ├── conflictAnalyzer.ts     # Zero-result cause diagnosis (post-generation)
│   ├── metrics.ts              # Gap, compactness, free day, end-time computation
│   ├── ranking.ts              # Weighted scoring profiles
│   ├── slotCatalog.ts          # Chennai + Vellore slot catalog (standard)
│   ├── apSlotCatalog.ts        # AP slot catalog (Tue–Sat, variable lab durations)
│   ├── bhopalSlotCatalog.ts    # Bhopal slot catalog (in progress)
│   ├── worker.ts               # Web Worker entry point
│   └── types.ts                # All shared types and interfaces
│
├── features/
│   ├── planner/                # MobilePlannerFlow (3-step), DesktopPlannerLayout
│   │   └── steps/              # StepCourses, StepConstraints, StepReview
│   ├── catalog/                # CatalogSearch with client-side TTL cache
│   ├── courses/                # CourseBuilder, FacultyPreferences
│   ├── constraints/            # ConstraintPanel
│   ├── import/                 # CSV/XLSX import pipeline (normalize → validate → transform)
│   ├── paste-import/           # Smart text parser for WhatsApp-forwarded course lists
│   └── results/                # SlotMatrixTimetable, ZeroResultsPanel, ShareCard, iCal dialog
│
├── lib/
│   ├── supabase/               # Browser, server, and admin Supabase clients
│   ├── export/                 # iCal generator, share card capture
│   ├── catalogCache.ts         # Map-based query cache, keyed by campus + program + query
│   ├── shareStore.ts           # Share link encode/decode (LZ-string)
│   └── storageUtils.ts         # localStorage capacity monitoring
│
├── store/useAppStore.ts        # Zustand global store — all app state + persistence
├── hooks/                      # useGenerator, useMediaQuery
└── supabase/migrations/        # Versioned SQL migrations
```

**Generation algorithm in brief:** courses are sorted by ascending option count (MRV) before search. At each DFS node, `violatesOptionHardConstraints` prunes infeasible options immediately; `conflictsWithExisting` prunes time overlaps against already-placed courses. Soft constraints (max gap) are deferred to complete-timetable checks to avoid premature pruning. Results are scored through a weighted metric pipeline and returned sorted by descending score.

---

## Local Development

**Prerequisites:** Node.js 18+, a Supabase project

```bash
git clone https://mrRR7/ffcsmaker
cd ffcsmaker
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials and an `ADMIN_SECRET_KEY`.

Run the SQL files in `supabase/migrations/` against your Supabase project, then:

```bash
npm run dev
```

The admin panel at `/admin` handles semester and course data upload — it's developer-only, protected by `ADMIN_SECRET_KEY`.

---

## Contributing

Source-visible. Not actively seeking contributions — but bug reports via issues are welcome.

---

<div align="center">
<sub>Built by Rakesh Rajanikanth· VIT Chennai · Not affiliated with VIT University</sub>
</div>
