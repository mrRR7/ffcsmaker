# Ultimate FFCS Planner — Code Audit & Improvement List

Full read-through of the repo (`src/`, `supabase/`, config, and git state) done on 2026-09-05. Findings are grouped by severity. Each item names the exact file so you can jump straight to it.

---

## 1. Critical — live bugs users are hitting right now

### 1.1 Four constraint toggles do nothing
`ConstraintPanel.tsx` (rendered in both `DesktopPlannerLayout.tsx` and `StepConstraints.tsx`, so every user sees it) renders these as normal switches, indistinguishable from the ones that work:

- "Minimize active days" → `constraints.minimizeDays`
- "Prefer compactness" → `constraints.preferCompactness`
- "Prefer half days" → `constraints.preferHalfDays`
- "Prefer early finish" → `constraints.preferEarlyFinish`

None of these fields are ever read by `engine/generator.ts`, `engine/conflict.ts`, or `engine/ranking.ts` — grep confirms the only places they appear are the type definition, the store default, and the toggle itself. Toggling them updates Zustand state and nothing else. Since there's *also* a ranking mode literally called "Half Days" and an "Early Finish" mode that do work (via `ranking.ts` weight profiles), this is doubly confusing — students will assume the toggle and the ranking mode do different things, but only one of them is real.

**Fix:** either wire these into `scoreSchedule`/`hasCompleteHardViolations` as soft-scoring boosts, or delete the toggles and point users at the ranking mode dropdown instead. Given three of the four already have an equivalent ranking mode, deleting is probably less work and less confusing.

### 1.2 Constraint fields are reset every time you change any constraint
In `store/useAppStore.ts`, `setConstraint()` runs every update through `normalizeImportedConstraints()`, which unconditionally does:
```ts
preferredDaysOff: [],
avoidDays: [],
requireMinFreeDays: null,
```
So even if you wired up UI for "avoid Fridays" or "require 2 free days" tomorrow, the very next constraint change (checking a different box) would silently wipe it back to empty. This function was clearly written for import/migration sanitization but is now also sitting in the hot path of every single `setConstraint` call.

**Fix:** split `normalizeImportedConstraints` into a real "normalize legacy/imported data" function (used only in `migrate`/`applySharedState`) and a plain merge for `setConstraint`. Right now the store's own type signature promises these fields work; the implementation guarantees they can't.

### 1.3 Catalog search: program filter + limit ordering bug
In `app/api/catalog/search/route.ts`, the Supabase query applies `.limit(query.length >= 2 ? 20 : 50)` **before** the program filter is applied client-side (lines 77–91 — the filter happens in a JS `.map/.filter` on the already-limited result set). If a student's program (e.g. "AIML") only shows up in the 25th matching course but the DB limit cut the result off at 20, that course silently never appears in search — even though it exists and matches their program. This gets worse the more crowded a semester's catalog is.

**Fix:** filter by program inside the Supabase query (it's already partially there, commented out at lines 61-66) or fetch a larger page and filter before limiting, not after.

### 1.4 Admin session cookie *is* the raw secret
`app/api/admin/auth/route.ts`:
```ts
response.cookies.set("admin_session", adminSecret, { httpOnly: true, ... });
```
The session cookie's value is your literal `ADMIN_SECRET_KEY`. `middleware.ts` and `isAdminAuthed()` (duplicated in `courses/bulk/route.ts`) both check `cookie === process.env.ADMIN_SECRET_KEY`. Practically: `httpOnly`/`secure`/`sameSite: strict` do block the common attack paths, so this isn't an active exploit today — but it means (a) your one shared admin password is stored verbatim in every admin browser's cookie jar for 24h, so any leak (a Vercel log line, an errant `console.log`, a support screenshot) hands over full admin access permanently until you rotate the secret everywhere, and (b) the comparison is a plain `!==`, not constant-time, and there's no rate limiting or lockout on `/api/admin/auth` — nothing stops unlimited password-guessing attempts.

**Fix:** issue a random session token (signed or stored server-side) distinct from the secret, add basic rate limiting on the auth route (even an in-memory sliding window is better than nothing given single-admin usage), and pull `isAdminAuthed()` into one shared helper instead of copy-pasting it.

---

## 2. High — architectural / correctness issues

### 2.1 `SlotBuilder.tsx` and six store actions are fully dead
`store/useAppStore.ts` defines `addSlot`, `updateSlot`, `deleteSlot`, `clearSlots`, `applySlotPreset`, and `importSlotsFromCsv` — but every single one is stubbed to just reset slots back to `defaultSlots` (or return `0`) regardless of arguments:
```ts
addSlot: () => set({ slots: defaultSlots }),
updateSlot: () => set({ slots: defaultSlots }),
deleteSlot: () => set({ slots: defaultSlots }),
...
importSlotsFromCsv: () => 0,
```
`features/slots/SlotBuilder.tsx` (an 8.5KB component with a full add/edit/delete/CSV-import/preset UI) calls all of these expecting them to work. It's not reachable from any route today (grep found zero imports of `SlotBuilder` outside its own file), so no user currently hits the breakage — but it's ~250 lines of component plus 6 store actions of pure dead weight, and the `UniTimeStore` interface still advertises these as real capabilities. This looks like leftover scaffolding from before the switch to fixed per-campus slot catalogs (`slotCatalog.ts`/`apSlotCatalog.ts`/`bhopalSlotCatalog.ts`).

**Fix:** delete `SlotBuilder.tsx` and the six stub actions, or if custom slot editing is still a planned feature, implement them for real.

### 2.2 `lib/shareStore.ts` is dead and would be broken anyway
```ts
const STORE = new Map<string, string>();
export { STORE as SHARE_STORE };
```
Nothing imports `SHARE_STORE`. Even if something did, an in-memory `Map` doesn't survive across serverless function invocations on Vercel — every request can land on a different (or recycled) instance. Good thing it's unused; worth deleting so a future contributor doesn't wire it up and ship a silent data-loss bug. Actual share-link storage correctly goes through Supabase (`share_timetables` table via `app/api/share-timetable/route.ts`).

### 2.3 No safety cap on the DFS generation time, only on result count
`engine/generator.ts`'s `dfs()` stops appending once `schedules.length >= maxResults`, but if constraints are tight enough that almost nothing validates (e.g. a student picks 12 courses with 6 options each and very strict blocked windows), the search still has to walk a large fraction of the combinatorial tree before concluding "few/no results," with no iteration ceiling or time-based bailout. It runs in a Web Worker so the tab doesn't freeze, and there's a cancel button, but a user with a slower device and a large course list can be staring at a spinner for a long time with no feedback beyond a progress percentage that may barely move.

**Fix:** add a hard `checked` ceiling (e.g. a few million nodes) or a wall-clock budget (e.g. 8–10s) that stops the search and returns whatever was found with a "search was capped, try narrowing constraints" message — much better UX than an open-ended wait.

### 2.4 RLS policies allow unrestricted, unauthenticated writes with no app-level enforcement
`supabase/schema.sql`:
```sql
CREATE POLICY "share_timetables_insert" ON share_timetables FOR INSERT WITH CHECK (true);
CREATE POLICY "share_insert" ON share_links FOR INSERT WITH CHECK (true);
```
Your public anon key is, by definition, visible in client bundles. These policies mean anyone can `supabase.from('share_timetables').insert(...)` directly from a browser console — bypassing your API route's 1MB payload check entirely, since RLS has no size limit. Same for `share_links`. `vtop_imports` is safer only because it has RLS enabled with *no* policy at all, which defaults to deny for the anon/authenticated roles — that one's fine as-is, but it looks accidental rather than intentional given every other table got an explicit policy.

**Fix:** either move these two writes fully behind the API route (drop the public insert policy, insert only via the service-role client, which you already do in `route.ts`) or add a DB-level size constraint (`CHECK (length(snapshot_json::text) < 1000000)`) so RLS can't be used to bypass your app's limit.

### 2.5 No rate limiting on any public API route
`catalog/search`, `catalog/semesters`, `share-timetable` (POST), and `vtop-import` (POST, and CORS-open to `*`) have zero rate limiting. `share-timetable` and `vtop-import` both accept unauthenticated writes into your database (up to 1MB / 2MB per request respectively) with nothing stopping someone from scripting thousands of inserts. Given this is a free, single-admin-maintained tool, an unbounded write endpoint is a real cost/abuse exposure, not just theoretical.

**Fix:** add basic IP-based rate limiting (Vercel's `@vercel/firewall`/Upstash `@upstash/ratelimit`, or even a simple in-memory token bucket given your traffic level) to the write endpoints at minimum.

### 2.6 Catalog search builds PostgREST filter strings by hand
```ts
const safeQuery = query.replace(/[,%]/g, "");
coursesQuery = coursesQuery.or(`course_code.ilike.${safeQuery}%,course_name.ilike.%${safeQuery}%`);
```
Stripping `,` and `%` blocks the most obvious PostgREST `.or()` injection (adding extra filter clauses), but the value is still interpolated raw into a filter expression string rather than passed through Supabase's parameterized filter builder. Characters like `.` or `)` aren't stripped and could still perturb how PostgREST parses the expression. Low real-world risk today (worst case is a malformed-filter 400, not data exposure), but worth tightening since it's user-controlled input going into a query string.

**Fix:** use chained `.ilike()` calls per column with Supabase's own escaping, or at minimum widen the sanitization to alphanumeric + space.

---

## 3. Medium — code quality, maintainability, robustness

### 3.1 No tests anywhere in the repo
Zero `*.test.*`/`*.spec.*` files. The generation engine (`generator.ts`, `conflict.ts`, `ranking.ts`, `consolidation.ts`) is exactly the kind of pure-function, high-value logic that's cheap to unit test and expensive to get subtly wrong (e.g. the program-filter/limit bug in 1.3, or a future regression in `rangesOverlap`/`hasInternalSlotConflict` silently letting a clashing timetable through). Given this is the core value proposition of the product, even a modest test suite around `engine/` would pay for itself the first time you touch ranking weights or add a campus.

### 3.2 No ESLint config, despite ESLint being installed
`package.json` has `"lint": "next lint"`, `eslint`, and `eslint-config-next` as dependencies, but there's no `.eslintrc*` or `eslint.config.*` anywhere in the repo. Running `npm run lint` today will either fail or trigger Next's interactive "no config found, create one?" prompt — meaning linting isn't actually running in your workflow (and can't run in CI, since there's no CI either — no `.github/` directory).

### 3.3 No CI pipeline
No `.github/workflows`. `typecheck`, `lint`, and `build` are all defined as npm scripts but nothing runs them automatically on push/PR. Given Vercel auto-deploys on push, a broken build gets caught at deploy time, but type errors and lint issues can merge silently. A minimal GitHub Action running `npm run typecheck` and `npm run build` on push would catch most regressions before they ship.

### 3.4 `@next/bundle-analyzer` is installed but never wired up
It's in `dependencies` but `next.config.mjs` is a 4-line file that doesn't import or wrap with it. Either wire it in (`ANALYZE=true next build`) since you clearly intended to check bundle size at some point, or drop the dependency.

### 3.5 Oversized components
`features/courses/CourseBuilder.tsx` is 887 lines and 31.8KB — the largest file in the project by a wide margin. `store/useAppStore.ts` is 31KB/895 lines as a single flat store. Both work, but at this size they're hard to review, hard to test in isolation, and every change risks an unrelated regression. Worth splitting `CourseBuilder` into smaller subcomponents (e.g. separate option-row, faculty-ranking, and import-trigger pieces) and considering Zustand slices (one per concern: courses, constraints, generation, UI prefs) for the store.

### 3.6 `xlsx` (SheetJS) dependency
`xlsx: ^0.18.5` is the version line that had known prototype-pollution and ReDoS advisories; the SheetJS project's fixes for those moved to their own CDN rather than continuing npm releases under the same name for a while. Worth running `npm audit` and checking whether you're on a patched version or should pin to the CDN-hosted release SheetJS now recommends, since this package parses untrusted user-uploaded files (`features/import/importXlsx.ts`).

### 3.7 Duplicated admin-auth check
`isAdminAuthed()` is defined identically inline in `app/api/admin/courses/bulk/route.ts` and re-implemented as an inline comparison in `middleware.ts`. Pull it into one `lib/adminAuth.ts` helper so a future change to the auth scheme (see 1.4) only has to happen once.

### 3.8 Committed build artifacts
`dev.log`, `dev.err`, and `tsconfig.tsbuildinfo` are all tracked in git (`git ls-files` confirms it), and none of the three are in `.gitignore`. These are local dev-server output and TypeScript's incremental build cache — neither should be versioned; they'll just generate noisy diffs and occasionally stale merge conflicts.

---

## 4. Low — polish, SEO, hygiene

### 4.1 Broken social preview image
`app/layout.tsx` sets `openGraph.images` and `twitter.images` to `'favicon.png'`, with a comment right next to it: `// 1200x630px — make this`. There is no `favicon.png` in `public/` (only `logo.png`, `robots.txt`, `temp.png`, and `vtop-bookmarklet.js`). Since your README explicitly leans on WhatsApp/Instagram sharing for growth, every link shared to WhatsApp, Twitter, iMessage, or Discord right now renders with a broken image. This is a quick, high-leverage fix: export a real 1200×630 OG image from your existing brand assets and point both fields at it with an absolute path.

### 4.2 `public/temp.png`
A file literally named `temp.png` (12.6KB) is sitting in the public folder and therefore publicly served at `/temp.png`. Worth checking whether anything still references it; if not, delete it — if it's an actual asset, rename it to something meaningful.

### 4.3 Dead/redirect-only route
`app/disclaimer/page.tsx` is just `redirect("/terms")`. Harmless, but if nothing links to `/disclaimer` anymore it's a route to delete; if things still do, worth updating those links directly instead of paying a redirect hop.

### 4.4 Sitemap coverage
`app/sitemap.ts` lists only `/`, `/planner`, `/results`, `/privacy`. `/compare`, `/saved`, `/terms` aren't listed (reasonable to exclude `/dashboard`, `/settings`, `/admin` as non-indexable). Also every entry uses `lastModified: new Date()` at build time, which makes the field meaningless (it always says "just now" regardless of whether that page actually changed) — either drop the field or track real per-route change dates.

### 4.5 Commented-out dead code in `catalog/search/route.ts`
Lines 61–66 are a commented-out earlier version of the program filter, with a stale "temporary" note. The real implementation now lives below it in a different form (see 1.3). Delete the commented block so the next person reading this file doesn't have two competing implementations to reconcile.

### 4.6 Stray `console.log` calls
`app/results/page.tsx`, `engine/conflictAnalyzer.ts`, `engine/consolidation.ts`, `features/import/validateImport.ts`, and `utils/export.ts` all have `console.log` calls left in (e.g. `consolidation.ts` logs a full "Shape Consolidation Metrics" block on every generation run). Harmless, but worth gating behind a `DEBUG` flag or removing before it ships to more users.

---

## 5. Repo/operational note (not code, but worth knowing)

Your local `.git` has a leftover `index.lock` file that a normal git command can't clean up on its own (`unable to unlink '.git/index.lock': Operation not permitted` when I ran a read-only `git status` here), and `git status` shows **89 files modified** against a last commit from 2026-06-26 — two-plus months of local changes not yet committed anywhere, including everything covered in this report. Two independent risks worth acting on soon:

1. If that lock file is stale (i.e., no git operation is actually mid-flight on your machine), delete `.git/index.lock` so `git add`/`git commit` stop being blocked.
2. Commit and push the accumulated local work — right now it only exists on this one machine's disk.

I didn't touch git state myself since that's your call to make, but happy to do either if you'd like.

---

## Suggested priority order

1. Fix or remove the four dead constraint toggles (1.1) and the self-resetting constraint fields (1.2) — these directly mislead every user of the planner.
2. Fix the catalog search limit/filter ordering bug (1.3) — students are plausibly missing valid courses today.
3. Harden admin auth (1.4) and lock down the two open RLS insert policies (2.4), since both are exploitable with zero effort by anyone who opens devtools.
4. Add rate limiting to the two public write endpoints (2.5).
5. Clean up dead code (2.1, 2.2, 3.7) while you're already touching these areas.
6. Fix the OG image (4.1) — cheap, and directly supports the WhatsApp/Instagram growth loop your README calls out.
7. Everything else (tests, CI, lint config, bundle analyzer, component splitting) as ongoing hygiene, ideally before the Sem 4 revamp you mentioned focusing on faculty data coverage and onboarding.
