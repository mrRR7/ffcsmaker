# Ultimate FFCS: product video brief

Status: brief approved; look and 8 s music sample approved (invented professor names, CTA ultimateffcs.in, recorded piano). **(you)** marks your answers; **(me)** marks my calls, each one yours to veto in a line.

## The one sentence the film proves

> Add your courses, say what you'd avoid, and every clash-free week shows up ranked, ready to compare. **(me, from your hero copy)**

It's told from the student's side: they type, they tap, the weeks appear.

## Format

| | |
|---|---|
| Kind | product video, in the clean register: your real UI redrawn in code, no screen recording **(you)** |
| Shape | 9x16, 1080x1920, for Reels, Shorts and WhatsApp Status **(you)** |
| Length | about 30 s **(me: Reels sweet spot; five beats at roughly 4 s each plus the hook and end card)** |
| fps | 60 **(me: UI motion, rendered with motion blur)** |
| Sound | an original score plus UI sound effects **(you)**. Style `drive` (driving electronic) at 120 bpm **(me: forward and confident; 120 bpm puts one beat on exactly 30 frames)** |
| Captions | no voice-over, so the words on screen do the talking; it reads with the sound off |

## The flow **(you)**: search → constraints → generate → ranked → compare

| # | Beat | What's on screen | Words (your own copy) | ~s |
|---|---|---|---|---|
| 0 | Hook | The search field, large, with "Data Struc" typed mid-word at frame 0 (frame 0 is the thumbnail) | none, the typing is the hook | 0-3 |
| 1 | Search | Results drop in; two professors get ticked; Add; the course stacks into the list, then 4 more land quickly and the credit counter counts up | **01 Add courses** | 3-8 |
| 2 | Constraints | Preferences: tap **No 8 AM classes**, then **Done by 5 PM** | **02 Say what you'd avoid** | 8-12 |
| 3 | Generate | Press **Find my weeks**; the coral block lifts off the button; the week count runs up | (the count is the word) | 12-15 |
| 4 | Ranked | **Best first**; scores out of 100; the top week's real FFCS slot grid fills in block by block | **03 Pick a week** | 15-21 |
| 5 | Compare | Two weeks side by side, **What differs** row | **Compare up to three** | 21-26 |
| 6 | End card | The logo builds itself; the coral block lands as its fourth square | **Your FFCS timetable, built in about a minute.** + URL + "Free, no login" | 26-30, held ≥ 3 s |

Words sit in their own band above the UI, never on top of it.

## Brand (taken from the repo)

- **Mark:** `public/logo.svg`: an F built from four rounded squares, the last one coral `#FF6B4A`. It sits as a small corner mark on every frame.
- **Motif (me):** the coral square. It's the one thing that crosses the seams: it's the press on Find my weeks, a block in the grid, and finally the last piece of the logo on the end card.
- **UI:** `src/app/fp-tokens.css`. Ground `#0b0e11`, surface `#141a1f`, ink `#e6edea`, muted `#7e8b90`, accent green `#3fa96b`, rule `#2a343b`. Course colours come from `src/lib/coursePalette.ts` (`#14b8a6 #6366f1 #f59e0b #ec4899 #38bdf8 #f97316`).
- **Type:** Space Grotesk for display, IBM Plex Sans for body, IBM Plex Mono for the mono-uppercase labels (`.14em` tracking).
- **The grid** keeps the real FFCS layout: THEORY and LAB blocks, real slot codes and times from `src/engine/slotCatalog.ts`.

## Data

- **Courses:** the made-up sample set from the landing hero (`src/features/landing/HeroWeekGrid.tsx`: CSE2001 Data Structures, MAT2001 Linear Algebra, …), which the site already labels as sample courses. **(me)**
- **Every number is real output:** the week count, the scores and the end times come from running your actual generator on that set, never typed in by hand.
- **Professor names:** invented, never taken from the catalog, so no real faculty member shows up in a marketing video. **(me, open question)**

## Approved claims, with sources

- "Your FFCS timetable, built in about a minute." (landing h1, `src/app/page.tsx`)
- "Free, no login, nothing sent to VTOP." (landing subhead)
- "Every conflict-free combination of your courses, ranked." (landing subhead)
- Add courses / Say what you'd avoid / Pick a week (`LandingSteps`)
- Find my weeks, No 8 AM classes, Done by 5 PM, Best first, What differs (UI labels)
- Vellore, Chennai, Bhopal (FAQ)

## Banned claims

- Any VIT affiliation or endorsement (footer: "Not affiliated with VIT University")
- That it registers courses on VTOP for you, or guarantees a seat or slot
- User counts, "trusted by", ratings, testimonials
- VIT-AP support (still in progress)
- Any speed claim stronger than "about a minute"

## CTA

`ultimateffcs.in` **(me, from the README; confirm)**

## Build notes

- The film project lives outside the app repo (it has its own node_modules and a headless browser): `../ffcs-launch-film/`.
- Approval gates: this brief → an 8 s music sample → the finished file.
