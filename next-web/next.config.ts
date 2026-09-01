import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development-only: permits localhost and the temporary sandbox preview
  // domain to load Next.js client chunks during local validation. This does
  // not expose server-side environment variables or affect production routes.
  allowedDevOrigins: ["127.0.0.1", "*.manus.computer", "*.us3.manus.computer", "*.us4.manus.computer", "3001-icc3d2sz8u84q2z99yysb-a2f543bd.us4.manus.computer"],
};

export default nextConfig;
