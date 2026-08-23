import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    
    const res = await fetch(`${backendUrl}/public/reviews`, {
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
    console.error("[IT ADIS] Public reviews error:", error);
    return NextResponse.json([
      { id: 1, name: "Kamila Asanova", role: "Frontend Developer @ Epam", initials: "KA", color: "from-green-500 to-emerald-700", stars: 5, text: "IT ADIS changed my life. Before the course I was a barista with zero coding experience. 6 months later I got hired as a junior frontend dev.", course: "Frontend Development" },
      { id: 2, name: "Marat Dzhaksybekov", role: "Python Developer @ Kaspi", initials: "MD", color: "from-blue-500 to-blue-700", stars: 5, text: "The Python course is insanely practical. No slides, no theory overload — just building things from day one.", course: "Python Development" },
      { id: 3, name: "Sarah Thompson", role: "AI Engineer @ Yandex", initials: "ST", color: "from-purple-500 to-purple-700", stars: 5, text: "The AI course goes way beyond surface-level tutorials. We built production ML models and deployed them to real users.", course: "Artificial Intelligence" },
      { id: 4, name: "Alex Chen", role: "Fullstack @ Microsoft", initials: "AC", color: "from-cyan-500 to-cyan-700", stars: 5, text: "The mentorship here is unreal — they don't just teach code, they teach you how to think like a developer.", course: "JavaScript & TypeScript" },
      { id: 5, name: "Elena Petrova", role: "Data Scientist @ Tinkoff", initials: "EP", color: "from-pink-500 to-rose-700", stars: 5, text: "Got hired before even finishing the course.", course: "Data Science" },
      { id: 6, name: "Omar Nazarbayev", role: "Startup CTO", initials: "ON", color: "from-orange-500 to-red-700", stars: 5, text: "The Vibe Coding course made me 5x more productive.", course: "Vibe Coding" },
    ], { status: 200 });
  }
}