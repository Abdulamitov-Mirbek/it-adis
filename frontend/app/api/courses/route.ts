import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    
    const res = await fetch(`${backendUrl}/courses`, {
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
    console.error("[IT ADIS] Courses error:", error);
    return NextResponse.json([
      { id: "1", slug: "python", title: "Python Development", description: "Master Python from basics to advanced backend development.", duration: "6 months", level: "BEGINNER", price: 0, isActive: true, isFeatured: true, order: 1, tags: ["Python", "Django", "FastAPI"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "2", slug: "javascript", title: "JavaScript & TypeScript", description: "Build modern web apps with JS and TypeScript.", duration: "5 months", level: "BEGINNER", price: 0, isActive: true, isFeatured: true, order: 2, tags: ["JavaScript", "TypeScript", "Node.js"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "3", slug: "frontend", title: "Frontend Development", description: "Create stunning UIs with React and Next.js.", duration: "5 months", level: "INTERMEDIATE", price: 0, isActive: true, isFeatured: true, order: 3, tags: ["React", "Next.js", "Tailwind"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "4", slug: "vibe-coding", title: "Vibe Coding", description: "AI-assisted development for the modern era.", duration: "3 months", level: "ALL_LEVELS", price: 0, isActive: true, isFeatured: true, order: 4, tags: ["AI Tools", "Cursor", "Productivity"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "5", slug: "ai", title: "Artificial Intelligence", description: "Deep dive into ML, neural networks and production AI.", duration: "7 months", level: "ADVANCED", price: 0, isActive: true, isFeatured: true, order: 5, tags: ["ML", "PyTorch", "NLP"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "6", slug: "data-science", title: "Data Science", description: "Turn raw data into actionable insights.", duration: "6 months", level: "INTERMEDIATE", price: 0, isActive: true, isFeatured: false, order: 6, tags: ["Pandas", "SQL", "Visualization"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ], { status: 200 });
  }
}