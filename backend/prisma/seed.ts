import { PrismaClient, CourseLevel } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Hash password using bcrypt for consistency with auth service
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

const courses = [
  {
    slug: "python-development",
    title: "Python Development",
    description: "From basics to advanced — data manipulation, automation, web scraping, and building APIs.",
    longDesc: "A comprehensive Python course covering OOP, data structures, web scraping, REST APIs with FastAPI, and automation scripts.",
    duration: "4 months",
    level: CourseLevel.BEGINNER,
    price: 35000,
    isFeatured: true,
    order: 1,
    tags: ["Python", "Backend", "Data", "Automation"],
  },
  {
    slug: "javascript-typescript",
    title: "JavaScript & TypeScript",
    description: "Master the language of the web. From vanilla JS to modern TypeScript patterns used in production.",
    longDesc: "Deep dive into JavaScript fundamentals, ES2024+, async programming, and TypeScript for production apps.",
    duration: "3 months",
    level: CourseLevel.BEGINNER,
    price: 30000,
    isFeatured: true,
    order: 2,
    tags: ["JavaScript", "TypeScript", "Frontend", "Backend"],
  },
  {
    slug: "frontend-development",
    title: "Frontend Development",
    description: "React, Next.js, Tailwind CSS, and modern tooling. Build stunning, performant web applications.",
    longDesc: "Complete frontend engineering: React, Next.js App Router, Tailwind CSS, state management, testing, Vercel deployment.",
    duration: "5 months",
    level: CourseLevel.INTERMEDIATE,
    price: 45000,
    isFeatured: true,
    order: 3,
    tags: ["React", "Next.js", "TypeScript", "CSS"],
  },
  {
    slug: "vibe-coding",
    title: "Vibe Coding",
    description: "AI-assisted coding workflows, prompt engineering for devs, and building fast with LLMs.",
    longDesc: "Learn Cursor, Copilot, Claude, GPT-4 to multiply your development speed 3-10x.",
    duration: "2 months",
    level: CourseLevel.ALL_LEVELS,
    price: 20000,
    isFeatured: false,
    order: 4,
    tags: ["AI", "LLMs", "Productivity", "Vibe Coding"],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert courses
  for (const course of courses) {
    await prisma.course.upsert({
      where:  { slug: course.slug },
      update: course,
      create: course,
    });
    console.log(`  ✓ Course: ${course.title}`);
  }

  // Upsert default admin
  const hashedPassword = hashPassword("itadis_admin_2026");
  await prisma.adminUser.upsert({
    where:  { email: "admin@itadis.edu" },
    update: {
      passwordHash: hashedPassword,
      name: "IT ADIS Admin",
    },
    create: {
      email:        "admin@itadis.edu",
      passwordHash: hashedPassword,
      name:         "IT ADIS Admin",
    },
  });
  console.log("  ✓ Admin user: admin@itadis.edu / itadis_admin_2026");

  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
