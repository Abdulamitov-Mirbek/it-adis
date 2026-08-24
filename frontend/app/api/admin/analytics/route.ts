import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, {
    path: "/admin/analytics",
    requireAuth: true,
    forwardQuery: true,
  });
}
