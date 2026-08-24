import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

/**
 * Page-view beacon. Public because the browser calls it on every navigation.
 *
 * It answers 204 whatever happens: analytics must never surface an error to a
 * visitor, and a dropped view is not worth a retry.
 */
export async function POST(req: NextRequest) {
  try {
    await proxyToBackend(req, { path: "/analytics/track", method: "POST" });
  } catch {
    // Swallowed deliberately.
  }
  return new Response(null, { status: 204 });
}
