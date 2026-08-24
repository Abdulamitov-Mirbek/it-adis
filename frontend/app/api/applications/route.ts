import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

/**
 * Deliberately has no fallback. The previous version answered "Application
 * received (dev mode)" when no backend was configured, so a prospective
 * student got a success message for a form submission that was written
 * nowhere. A visible failure they can retry is far better than a silent loss.
 */
export async function POST(req: NextRequest) {
  return proxyToBackend(req, { path: "/applications", method: "POST" });
}
