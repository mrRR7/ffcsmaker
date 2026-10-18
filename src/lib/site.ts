// Values that change per semester or per launch live here, so copy and links
// can be updated without touching layout.

export const SITE_URL = "https://www.ultimateffcs.in";

// Landing stats line. Static on purpose: update by hand each semester.
export const SITE_STATS = ["8,000+ visitors", "55,000+ page views", "Fall FFCS 2026"];

// Empty hides the Instagram link everywhere. Set to the handle (no @) once the account exists.
export const INSTAGRAM_HANDLE = "ultimate.ffcs";

// Winter banner: on unless NEXT_PUBLIC_WINTER_BANNER is "off". Flip the env var
// in Vercel and redeploy to hide it; no code change needed.
export const SHOW_WINTER_BANNER = process.env.NEXT_PUBLIC_WINTER_BANNER !== "off";

// Usage events: on unless NEXT_PUBLIC_USAGE_EVENTS is "off" (rollback switch).
export const USAGE_EVENTS_ENABLED = process.env.NEXT_PUBLIC_USAGE_EVENTS !== "off";

// Admin "FFCS window" totals count events from this date (IST) onward.
export const FFCS_WINDOW_START = "2026-10-19";
