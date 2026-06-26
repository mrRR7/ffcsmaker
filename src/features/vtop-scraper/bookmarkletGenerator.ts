import { BOOKMARKLET_IIFE } from "./generated/bookmarkletCode";

function encodeBookmarklet(code: string): string {
  return `javascript:${encodeURIComponent(code)}`;
}

/** Returns a draggable bookmark href for the Ultimate FFCS scraper. */
export function getBookmarkletHref(): string {
  return encodeBookmarklet(BOOKMARKLET_IIFE);
}

/** Script-loader bookmarklet when inline href exceeds browser limits. */
export function getBookmarkletLoaderHref(origin = ""): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const loader = `(function(){var s=document.createElement('script');s.src='${base}/vtop-bookmarklet.js?'+Date.now();(document.body||document.documentElement).appendChild(s);})();`;
  return encodeBookmarklet(loader);
}
