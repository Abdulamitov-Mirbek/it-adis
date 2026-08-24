import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";
import { FALLBACK_COURSES } from "@/lib/server/fallback-data";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, {
    path: "/courses",
    forwardQuery: true,
    fallback: () => FALLBACK_COURSES,
  });
}
