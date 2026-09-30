# Ultimate FFCS — Logo Guidelines

## 1. The logo
- **Idea**: an F built from timetable blocks, with one free slot in coral.
- **Versions**: horizontal (primary) · stacked · symbol · wordmark. Each has a normal file (for light backgrounds) and a `-reversed` file (for dark backgrounds), plus `-black` and `-white` one-colour files.
- **Files**: `svg/` masters and one-colour versions · `png/` 1600 px exports. The site's favicon, app icon, web manifest and OG image live in the app itself (`src/app/icon.svg`, `apple-icon.png`, `favicon.ico`, `public/site.webmanifest`, `public/og-image.png`); `gen_final.py` and `gen_og.py` regenerate the artwork they came from.
- **Always use the supplied files.** The wordmark is outlined artwork, so never retype it.

## 2. Clear space
Keep a clear zone of **1 × X** on every side, where **X = the side of the coral tile** (28% of the symbol's height). The zone scales with the logo.

## 3. Minimum size
| Version | Screen | Print |
|---|---|---|
| Horizontal | 100 px wide | 25 mm wide |
| Stacked | 90 px wide | 22 mm wide |
| Symbol | 16 px, using `symbol-small*.svg` below 32 px | 6 mm |

## 4. Colour
| Name | Role | HEX | RGB | CMYK (naive, unprofiled) |
|---|---|---|---|---|
| Coral | the accent tile (nothing else) | `#FF6B4A` | 255 107 74 | 0 58 71 0 |
| Warm ink | logo on light backgrounds | `#211A17` | 33 26 23 | 0 21 30 87 |
| Cream | logo on dark backgrounds | `#F6EFE4` | 246 239 228 | 0 3 7 4 |
| Warm dark | dark ground, app-icon tile | `#1A1512` | 26 21 18 | 0 19 31 90 |

CMYK values are a plain conversion, not colour-managed. Pantone matches have not been chosen; match against a swatch book before printing.

**Approved pairs**: ink logo on white or cream (17:1, 15:1) · reversed logo on warm dark (16:1) · black or white one-colour version on anything busy or single-colour.

**Coral is a graphic accent, not a text colour.** It is 2.8:1 on white and 2.5:1 on cream, so it does not reach the 3:1 level for graphics, and it is far below 4.5:1 for text. On warm dark it is 6.4:1 and is fine. Where the tile sits on a light background it is supported by the dark F next to it. Do not use coral for small text on light backgrounds.

## 5. Typography
- Wordmark: Space Grotesk Bold, outlined, tracking −1%. Licence: SIL Open Font License.
- The `/new` skin's IBM Plex Sans and Mono (also OFL) remain the UI fonts.

## 6. Small sizes
Use the small-size cut (`symbol-small.svg`, `symbol-small-reversed.svg`, `src/app/icon.svg` in the app) below 32 px. It has wider gaps and a slightly larger block radius, so the tile stays separate from the F at 16 px.

## 7. Don'ts
Don't stretch or squash · don't recolour the tile or the F · don't use the ink version on dark backgrounds (it disappears; use `-reversed`) · don't rotate, add shadows, outlines or gradients · don't move or resize the coral tile · don't place on busy backgrounds without a container, or the one-colour version · don't retype the wordmark.

## 8. Honest limits
- No trademark search has been done. Have one done before any commercial or wide use.
- Mockup names and handles in `presentation.html` (Alex Morgan, @ultimateffcs) are placeholders.
- Coral `#FF6B4A` is my pick to match the Figma redesign's direction, not a value read from the file.
