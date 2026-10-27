import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Serves the build-time prerenders (the campus pages are SSG with
// dynamicParams = false, so without this they 404). Read-only, no binding.
// ponytail: no ISR, so /timetable/[id] (revalidate = 3600) renders on every
// request. Swap in r2IncrementalCache if that page gets hot.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true
});
