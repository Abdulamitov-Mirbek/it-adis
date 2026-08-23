import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    
    const res = await fetch(`${backendUrl}/public/teachers`, {
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
    console.error("[IT ADIS] Public teachers error:", error);
    return NextResponse.json([
      { id: 1, name: "Amir Seitkali", role: "Lead Python & AI Instructor", bio: "10 years in ML engineering. Previously at Google DeepMind.", tags: ["Python", "ML", "NLP"], initials: "AS", color: "from-green-500 to-emerald-700" },
      { id: 2, name: "Diana Kozyreva", role: "Frontend & React Expert", bio: "Senior frontend engineer, 8 years. Ex-Figma.", tags: ["React", "Next.js", "TypeScript"], initials: "DK", color: "from-blue-500 to-blue-700" },
      { id: 3, name: "Viktor Petrov", role: "AI & Machine Learning Lead", bio: "PhD in Computer Science, 12 years in AI research.", tags: ["Deep Learning", "Computer Vision", "PyTorch"], initials: "VP", color: "from-purple-500 to-purple-700" },
    ], { status: 200 });
  }
}