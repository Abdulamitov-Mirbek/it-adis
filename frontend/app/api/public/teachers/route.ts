import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";
import { FALLBACK_TEACHERS } from "@/lib/server/fallback-data";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, { path: "/teachers", fallback: () => FALLBACK_TEACHERS });
}
