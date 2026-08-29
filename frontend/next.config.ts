import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Security response headers.
 *
 * The site previously sent none of these, and vercel.json additionally sent
 * `Access-Control-Allow-Origin: *` on /api/(.*) together with an allowed
 * `Authorization` header — which invited any origin on the internet to call the
 * admin proxy routes with a stolen or leaked token and read the response,
 * including the applications endpoint that returns every applicant's name,
 * e-mail and phone number. Those API routes are only ever called by this site's
 * own pages, so they need no CORS grant at all; removing the wildcard restores
 * the browser's same-origin default.
 */
const securityHeaders = [
  // Stop the admin panel being framed into a look-alike page and clickjacked.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // No MIME sniffing: an uploaded or proxied file cannot be re-interpreted as
  // a script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the full URL only to ourselves; other origins see the bare origin, so
  // admin paths and query strings do not leak through outbound links.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site asks for none of these; deny them up front.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HTTPS only, for two years, once the visitor has been here once.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Enable React strict mode for better DX
  reactStrictMode: true,

  // Emit a self-contained server bundle for the Docker image: Next traces the
  // modules actually reached and copies just those, turning a ~1.2 GB image
  // (full node_modules) into roughly 200 MB. Harmless outside Docker — it only
  // adds .next/standalone alongside the normal build output.
  output: "standalone",

  // Next advertises its presence by default; there is no reason to tell an
  // attacker which framework and version to look up advisories for.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
