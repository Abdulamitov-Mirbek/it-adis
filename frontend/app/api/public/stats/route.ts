import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    
    const res = await fetch(`${backendUrl}/public/stats`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json"
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[IT ADIS] Public stats error:", error);
    return NextResponse.json(
      { students: 2500, employed: 95, courses: 5, years: 3 },
      { status: 200 }
    );
  }
}