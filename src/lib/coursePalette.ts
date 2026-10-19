// Default per-course colors, assigned in order as courses are added. The
// first six are the brand set used on the landing page and share card;
// green (collides with the UI accent) and violet (close to indigo) sit at
// the end so 7-8 course loads still get distinct colors.
export const COURSE_PALETTE: readonly string[] = [
  "#14b8a6",
  "#4f46e5", // was #6366f1 — best ink only reached 4.33:1; this gives 5.8:1
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#a78bfa"
];

/** Pre-a11y-fix indigo; remapped on rehydrate so saved courses get the fix too. */
export const LEGACY_INDIGO = "#6366f1";

export const BRAND_PALETTE: readonly string[] = COURSE_PALETTE.slice(0, 6);

export function colorForIndex(index: number): string {
  return COURSE_PALETTE[index % COURSE_PALETTE.length];
}
