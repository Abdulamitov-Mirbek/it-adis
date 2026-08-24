import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";
import { FALLBACK_STATS } from "@/lib/server/fallback-data";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, { path: "/public/stats", fallback: () => FALLBACK_STATS });
}
