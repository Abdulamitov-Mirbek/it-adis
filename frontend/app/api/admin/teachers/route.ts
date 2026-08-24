import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, { path: "/admin/teachers", requireAuth: true });
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, { path: "/teachers", method: "POST", requireAuth: true });
}
