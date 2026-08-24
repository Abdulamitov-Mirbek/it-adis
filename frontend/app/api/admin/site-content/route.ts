import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, { path: "/site-content", requireAuth: true });
}

export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, { path: "/site-content", method: "PATCH", requireAuth: true });
}
