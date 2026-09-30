// Default per-course colors, assigned in order as courses are added. The
// first six are the brand set used on the landing page and share card;
// green (collides with the UI accent) and violet (close to indigo) sit at
// the end so 7-8 course loads still get distinct colors.
export const COURSE_PALETTE: readonly string[] = [
  "#14b8a6",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#a78bfa"
];

export const BRAND_PALETTE: readonly string[] = COURSE_PALETTE.slice(0, 6);

export function colorForIndex(index: number): string {
  return COURSE_PALETTE[index % COURSE_PALETTE.length];
}
