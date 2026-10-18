/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The FFCS Planner skin used to live under /new; keep old links working.
      { source: "/new/:path*", destination: "/:path*", permanent: true },
      // Old production host -> new domain, same path and query (308). Exact host
      // only, so preview deployments are untouched. /api stays live for open tabs
      // and installed VTOP bookmarklets; /admin stays reachable on the old host.
      {
        source: "/:path((?!api(?:/|$)|admin(?:/|$)).*)",
        has: [{ type: "host", value: "ffcsmaker.vercel.app" }],
        destination: "https://www.ultimateffcs.in/:path",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
