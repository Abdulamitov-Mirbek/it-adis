import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";
import { FALLBACK_SITE_CONTENT } from "@/lib/server/fallback-data";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, {
    path: "/site-content",
    fallback: () => FALLBACK_SITE_CONTENT,
  });
}
