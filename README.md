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
- Runs in a Web Worker so the UI stays responsive; a generating screen holds until results land
- Ranking profiles (Balanced, Half Days, Minimize Gaps, Early Finish, Late Start) score every week 0–100 from half days, gaps, finish time, start time, daily balance and your professor ranking
- Full constraint system: blocked windows, no-classes-after time, per-day start/end times, professor avoids/locks, max gap slots

**Course input**
- Catalog search against the live Supabase-backed semester catalog. Pick your program once and its courses and professors come first under "Your program"; every other course stays searchable under "All courses", with duplicate options merged
- Smart paste parser handles WhatsApp-forwarded course lists in any text format
- CSV / XLSX import, manual entry, and a VTOP bookmarklet import

**Results**
- Slot matrix timetable with colour-coded courses and cell-level detail panels
- Swap a professor right under the grid: same week, the grid updates in place
- Week layouts ("shapes") and professor combos, side-by-side comparison of up to 3 timetables
- Zero-results diagnostic: names the courses or constraints responsible when no valid combination exists, with one-tap fixes

**Onboarding**
- Guided tour across planner and results; on an empty plan it can load sample courses, run a search, and clear them at the end unless kept

**Export & share**
- PDF, PNG, JSON, iCal (weekly repeating events for Google/Apple/Outlook Calendar)
- Copy the slot list for VTOP registration
- Persistent share links for course lists and specific timetables

**Multi-campus**
- VIT Chennai + VIT Vellore: standard slot catalog (Mon–Fri)
- VIT AP: Tue–Sat week, non-uniform lab durations
- VIT Bhopal: Bhopal slot catalog

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + in-house `fp-ui` primitives (theme tokens in `src/app/fp-tokens.css`) |
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
│   ├── [campus]/               # Static slot-timing pages per campus (SEO)
│   ├── planner/                # Courses + preferences, "Find my weeks"
│   ├── results/                # Browse, swap, export, share generated weeks
│   ├── compare/ saved/ settings/ support/
│   ├── timetable/[id]/         # Shared timetable view (public, no auth)
│   ├── admin/                  # Bulk catalog upload + usage stats (developer only)
│   └── api/
│       ├── catalog/search/     # Whole campus/semester catalog (edge-cached)
│       ├── catalog/semesters/  # Semester metadata
│       ├── share-timetable/    # Share link creation + resolution
│       ├── events/             # Anonymous usage events (allowlisted props)
│       ├── vtop-import/        # VTOP bookmarklet hand-off
│       └── admin/              # Bulk course upload, auth
│
├── engine/                     # Generator, conflicts, zero-result analysis,
│                               # metrics, ranking, per-campus slot catalogs, worker
│
├── components/fp-ui/           # Design-system primitives, app shell, program picker
│
├── features/
│   ├── planner/fp/             # Search, paste, file, manual tabs; preferences
│   ├── programs/               # Program names + "Your program / All courses" scoping
│   ├── courses/                # Merging catalog options into the plan
│   ├── import/ paste-import/   # CSV/XLSX pipeline, free-text parser
│   ├── results/                # Slot matrix, block details, iCal dialog
│   ├── tour/                   # Guided tour + sample courses
│   ├── landing/ campus/        # Home page, campus pages
│   └── vtop-scraper/           # VTOP bookmarklet
│
├── lib/                        # Supabase clients, catalog cache, usage events, iCal
├── utils/                      # Share encoding, PNG/PDF export
├── store/useAppStore.ts        # Zustand store — app state + persistence
└── hooks/                      # useGenerator, useMediaQuery

supabase/migrations/            # Versioned SQL migrations
```

**Generation algorithm in brief:** courses are sorted by ascending option count (MRV) before search. At each DFS node, `violatesOptionHardConstraints` prunes infeasible options immediately; `conflictsWithExisting` prunes time overlaps against already-placed courses. Soft constraints (max gap) are deferred to complete-timetable checks to avoid premature pruning. Results are scored through a weighted metric pipeline (`src/engine/ranking.ts`) and returned sorted by descending score.

**Catalog and programs:** the client fetches a campus's whole active catalog once (`src/lib/catalogCache.ts`) and filters it locally per keystroke. Each professor option carries a `program` code (`BCE`, `BYB`, … or `ALL` for untagged); the program picker lists only codes present in the catalog, and friendly names live in `src/features/programs/programCatalog.ts`.

---

## Local Development

**Prerequisites:** Node.js 18+, a Supabase project

```bash
git clone https://github.com/mrRR7/ffcsmaker
cd ffcsmaker
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your Supabase URL, anon key, service role key, and an `ADMIN_SECRET_KEY`.

Run the SQL files in `supabase/migrations/` against your Supabase project, then:

```bash
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm test` (Node's built-in test runner).

The admin panel at `/admin` handles semester and course data upload — developer-only, protected by `ADMIN_SECRET_KEY`. Re-uploading a semester updates courses in place and replaces options only for the program codes present in the upload.

**Kill switch:** `NEXT_PUBLIC_PROGRAM_PICKER=off` hides the program picker and searches every course. It's read at build time, so changing it needs a redeploy.

---

## Contributing

Source-visible. Not actively seeking contributions — but bug reports via issues are welcome.

---

<div align="center">
<sub>Built by Rakesh Rajanikanth· VIT Chennai · Not affiliated with VIT University</sub>
</div>
