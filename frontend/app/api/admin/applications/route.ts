import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status');

    let url = `${backendUrl}/admin/applications?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: { 
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[IT ADIS] Admin applications error:", error);
    return NextResponse.json(
      { message: "Failed to fetch applications data" },
      { status: 500 }
    );
  }
}