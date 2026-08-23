import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalApplications,
      activeCourses,
    ] = await Promise.all([
      this.prisma.application.count(),
      this.prisma.course.count({ where: { isActive: true } }),
    ]);

    // Static/calculated stats for now
    return {
      students: Math.max(totalApplications * 3, 2500), // Estimate based on applications
      employed: 95, // Employment success rate
      courses: activeCourses,
      years: 3, // Academy operating years
    };
  }

  async getReviews() {
    return [
      { 
        id: 1,
        name: "Kamila Asanova", 
        role: "Frontend Developer @ Epam", 
        initials: "KA", 
        color: "from-green-500 to-emerald-700", 
        stars: 5, 
        text: "IT ADIS changed my life. Before the course I was a barista with zero coding experience. 6 months later I got hired as a junior frontend dev. The projects we built were better than what most bootcamps produce.", 
        course: "Frontend Development" 
      },
      { 
        id: 2,
        name: "Marat Dzhaksybekov", 
        role: "Python Developer @ Kaspi", 
        initials: "MD", 
        color: "from-blue-500 to-blue-700", 
        stars: 5, 
        text: "The Python course is insanely practical. No slides, no theory overload — just building things from day one. My mentor pushed me harder than any university professor ever did. Worth every tenge.", 
        course: "Python Development" 
      },
      { 
        id: 3,
        name: "Sarah Thompson", 
        role: "AI Engineer @ Yandex", 
        initials: "ST", 
        color: "from-purple-500 to-purple-700", 
        stars: 5, 
        text: "The AI course goes way beyond surface-level tutorials. We built production ML models and deployed them to real users. My salary doubled after graduating.", 
        course: "Artificial Intelligence" 
      },
      { 
        id: 4,
        name: "Alex Chen", 
        role: "Fullstack @ Microsoft", 
        initials: "AC", 
        color: "from-cyan-500 to-cyan-700", 
        stars: 5, 
        text: "Coming from a non-tech background, I was worried about keeping up. The mentorship here is unreal — they don't just teach code, they teach you how to think like a developer.", 
        course: "JavaScript & TypeScript" 
      },
      { 
        id: 5,
        name: "Elena Petrova", 
        role: "Data Scientist @ Tinkoff", 
        initials: "EP", 
        color: "from-pink-500 to-rose-700", 
        stars: 5, 
        text: "The data science program is incredibly hands-on. We worked with real datasets from day one and learned industry-standard tools. Got hired before even finishing the course.", 
        course: "Data Science" 
      },
      { 
        id: 6,
        name: "Omar Nazarbayev", 
        role: "Startup CTO", 
        initials: "ON", 
        color: "from-orange-500 to-red-700", 
        stars: 5, 
        text: "The Vibe Coding course taught me AI-assisted development that made me 5x more productive. Now I can prototype ideas in hours instead of weeks. Absolute game-changer for entrepreneurs.", 
        course: "Vibe Coding" 
      },
    ];
  }

  async getTeachers() {
    return [
      { 
        id: 1,
        name: "Amir Seitkali", 
        role: "Lead Python & AI Instructor", 
        bio: "10 years in ML engineering. Previously at Google DeepMind. Built production ML systems serving 50M+ users.", 
        tags: ["Python", "ML", "NLP"], 
        initials: "AS", 
        color: "from-green-500 to-emerald-700" 
      },
      { 
        id: 2,
        name: "Diana Kozyreva", 
        role: "Frontend & React Expert", 
        bio: "Senior frontend engineer, 8 years. Ex-Figma, open-source UI libraries with 12k stars.", 
        tags: ["React", "Next.js", "TypeScript"], 
        initials: "DK", 
        color: "from-blue-500 to-blue-700" 
      },
      { 
        id: 3,
        name: "Viktor Petrov", 
        role: "AI & Machine Learning Lead", 
        bio: "PhD in Computer Science, 12 years in AI research. Former Tesla Autopilot team member. Published 30+ papers.", 
        tags: ["Deep Learning", "Computer Vision", "PyTorch"], 
        initials: "VP", 
        color: "from-purple-500 to-purple-700" 
      },
    ];
  }
}