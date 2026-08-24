import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, { path: "/auth/login", method: "POST" });
}
