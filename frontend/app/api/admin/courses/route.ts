import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, {
    path: "/admin/courses",
    requireAuth: true,
    forwardQuery: true,
  });
}

/** Create a course. Backend route is guarded, so the token is required. */
export async function POST(req: NextRequest) {
  return proxyToBackend(req, { path: "/courses", method: "POST", requireAuth: true });
}
