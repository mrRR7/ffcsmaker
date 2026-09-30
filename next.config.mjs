/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The FFCS Planner skin used to live under /new; keep old links working.
  async redirects() {
    return [{ source: "/new/:path*", destination: "/:path*", permanent: true }];
  }
};

export default nextConfig;
