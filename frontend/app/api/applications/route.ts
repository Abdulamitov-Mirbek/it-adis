import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.BACKEND_API_URL;

    if (apiUrl) {
      // Forward to NestJS backend
      const res = await fetch(`${apiUrl}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Dev fallback — just acknowledge
    console.log("[IT ADIS] New application:", body);
    return NextResponse.json(
      { success: true, message: "Application received (dev mode)" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[IT ADIS] Application error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process application" },
      { status: 500 }
    );
  }
}
