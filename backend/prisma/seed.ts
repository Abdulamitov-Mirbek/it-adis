import { PrismaClient, CourseLevel } from "@prisma/client";

const prisma = new PrismaClient();

const courses = [
  {
    slug: "python-development",
    title: "Python Development",
    description:
      "From basics to advanced — data manipulation, automation, web scraping, and building APIs.",
    longDesc:
      "A comprehensive Python course taking you from absolute beginner to professional developer. Covers OOP, data structures, web scraping with BeautifulSoup/Selenium, REST APIs with FastAPI, and automation scripts.",
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
    description:
      "Master the language of the web. From vanilla JS to modern TypeScript patterns used in production.",
    longDesc:
      "Deep dive into JavaScript fundamentals, ES2024+, asynchronous programming, and TypeScript. Build real projects using modern tooling.",
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
    description:
      "React, Next.js, Tailwind CSS, and modern tooling. Build stunning, performant web applications.",
    longDesc:
      "Complete frontend engineering course. React fundamentals, Next.js App Router, Tailwind CSS, state management, testing, and deployment to Vercel.",
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
    description:
      "AI-assisted coding workflows, prompt engineering for devs, and building fast with LLMs.",
    longDesc:
      "The future of software development. Learn to leverage AI tools like Cursor, GitHub Copilot, Claude, and GPT-4 to multiply your development speed 3-10x.",
    duration: "2 months",
    level: CourseLevel.ALL_LEVELS,
    price: 20000,
    isFeatured: false,
    order: 4,
    tags: ["AI", "LLMs", "Productivity", "Vibe Coding"],
  },
  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence",
    description:
      "Neural networks, machine learning pipelines, LLMs, and practical AI applications.",
    longDesc:
      "Comprehensive AI/ML course covering supervised/unsupervised learning, deep learning with PyTorch, NLP, computer vision, and fine-tuning LLMs.",
    duration: "6 months",
    level: CourseLevel.ADVANCED,
    price: 60000,
    isFeatured: true,
    order: 5,
    tags: ["AI", "ML", "Deep Learning", "Python"],
  },
  {
    slug: "data-science",
    title: "Data Science",
    description:
      "Data analysis, visualization, statistical modeling, and real business insights.",
    longDesc:
      "Learn pandas, NumPy, matplotlib, seaborn, scikit-learn, and SQL. Build end-to-end data pipelines and dashboards for real business problems.",
    duration: "4 months",
    level: CourseLevel.INTERMEDIATE,
    price: 40000,
    isFeatured: false,
    order: 6,
    tags: ["Data", "Python", "Analytics", "SQL"],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
    console.log(`  ✓ Course: ${course.title}`);
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
