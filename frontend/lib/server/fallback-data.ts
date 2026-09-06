import type { Course, Review, SiteContent, Stats, Teacher } from "@/lib/api";

/**
 * Content served when the backend cannot be reached, so a marketing visitor
 * never sees a broken page. Public endpoints only — never the admin ones.
 *
 * The slugs here MUST match the keys in lib/course-meta.ts and the
 * `courseSlug` values in lib/tech-data.ts. They previously did not ("python"
 * vs "python-development"), so every course silently fell through to the
 * unstyled grey placeholder and no technology could find its course.
 */

const now = new Date().toISOString();

const course = (
  id: string,
  slug: string,
  title: string,
  description: string,
  longDesc: string,
  duration: string,
  level: Course["level"],
  order: number,
  tags: string[],
  isFeatured = true
): Course => ({
  id,
  slug,
  title,
  description,
  longDesc,
  duration,
  level,
  price: 0,
  isActive: true,
  isFeatured,
  order,
  tags,
  createdAt: now,
  updatedAt: now,
});

export const FALLBACK_COURSES: Course[] = [
  course(
    "1",
    "python-development",
    "Python Development",
    "Master Python from first principles through to production backend services.",
    "Start with syntax and data structures, then move into Django and FastAPI, PostgreSQL, background jobs and deployment. You finish with three deployed projects in your portfolio.",
    "6 months",
    "BEGINNER",
    1,
    ["Python", "Django", "FastAPI", "PostgreSQL"]
  ),
  course(
    "2",
    "javascript-typescript",
    "JavaScript & TypeScript",
    "The language of the web, taught properly — from closures to type-safe APIs.",
    "Modern JavaScript, then TypeScript's type system in depth: generics, narrowing and inference. Node.js services, testing, and the tooling professional teams actually run.",
    "5 months",
    "BEGINNER",
    2,
    ["JavaScript", "TypeScript", "Node.js", "Testing"]
  ),
  course(
    "3",
    "frontend-development",
    "Frontend Development",
    "Build interfaces people remember, with React and Next.js.",
    "Component architecture, state management, routing and data fetching in Next.js. Accessibility, performance budgets and animation — the craft that separates a portfolio from a product.",
    "5 months",
    "INTERMEDIATE",
    3,
    ["React", "Next.js", "Tailwind", "Accessibility"]
  ),
  course(
    "4",
    "vibe-coding",
    "Vibe Coding",
    "Build with AI as a collaborator, without losing the ability to build without it.",
    "Prompting, agents and AI-assisted refactoring with Cursor and Claude Code. Equal weight on judgement: reviewing generated code, spotting the confident mistakes, and staying the engineer in the loop.",
    "3 months",
    "ALL_LEVELS",
    4,
    ["AI Tools", "Cursor", "Agents", "Productivity"]
  ),
  course(
    "5",
    "flutter-development",
    "Flutter & Mobile Development",
    "Build apps for both phones from a single codebase, and publish them.",
    "Dart from the ground up, then Flutter widgets, navigation and state management. Network layers, offline storage and testing, finishing with a signed release submitted to the Play Store.",
    "5 months",
    "BEGINNER",
    5,
    ["Flutter", "Dart", "Android", "iOS"]
  ),
];

export const FALLBACK_STATS: Stats = {
  students: 2500,
  employed: 95,
  courses: FALLBACK_COURSES.length,
  years: 3,
};

export const FALLBACK_REVIEWS: Review[] = [
  { id: 1, name: "Kamila Asanova", role: "Frontend Developer @ EPAM", initials: "KA", color: "from-green-500 to-emerald-700", stars: 5, text: "IT ADIS changed my life. Before the course I was a barista with zero coding experience. Six months later I was hired as a junior frontend developer.", course: "Frontend Development" },
  { id: 2, name: "Marat Dzhaksybekov", role: "Python Developer @ Kaspi", initials: "MD", color: "from-blue-500 to-blue-700", stars: 5, text: "The Python course is relentlessly practical. No slide decks, no theory overload — you are building things from the first day.", course: "Python Development" },
  { id: 3, name: "Sarah Thompson", role: "AI Engineer @ Yandex", initials: "ST", color: "from-purple-500 to-purple-700", stars: 5, text: "The AI course goes far beyond surface-level tutorials. We built production models and deployed them to real users.", course: "Artificial Intelligence" },
  { id: 4, name: "Alex Chen", role: "Fullstack Engineer @ Microsoft", initials: "AC", color: "from-cyan-500 to-cyan-700", stars: 5, text: "The mentorship is the real product. They do not just teach you to code, they teach you to think like an engineer.", course: "JavaScript & TypeScript" },
  { id: 6, name: "Omar Nazarbayev", role: "Startup CTO", initials: "ON", color: "from-orange-500 to-red-700", stars: 5, text: "Vibe Coding made my whole team faster — and more careful. Knowing when not to trust the model is half the skill.", course: "Vibe Coding" },
];

/**
 * Served only when the teachers table cannot be read.
 *
 * Mirrors the real roster in backend/src/scripts/seed-teachers.ts rather than
 * inventing names: this used to hold three fictional instructors, so a backend
 * outage quietly replaced the school's actual mentors with people who do not
 * work there. No photos here — a fallback cannot reach storage either, and the
 * cards fall back to initials.
 */
export const FALLBACK_TEACHERS: Teacher[] = [
  { id: 1, name: "Bayastan", role: "Flutter-разработчик, Middle+", bio: "Более 5 лет в мобильной разработке. Flutter и Dart, архитектура приложений, релизы в App Store и Google Play.", tags: ["Flutter", "Dart", "Mobile"], initials: "BA", color: "from-cyan-500 to-sky-700" },
  { id: 2, name: "Adyl", role: "Senior Python-разработчик", bio: "Более 5 лет в backend-разработке на Python. Чистый код, проектирование сервисов и разбор реальных production-задач.", tags: ["Python", "Backend", "Senior"], initials: "AD", color: "from-green-500 to-emerald-700" },
  { id: 3, name: "Guldana", role: "Frontend-разработчик", bio: "Более 4 лет во фронтенде. React, Vue и Angular — помогает выбрать инструмент под задачу и не бояться нового фреймворка.", tags: ["React", "Vue", "Angular"], initials: "GU", color: "from-violet-500 to-purple-700" },
  { id: 4, name: "Azamat", role: "Full-stack разработчик", bio: "Более 4 лет во full-stack разработке. Ведёт студентов от вёрстки до сервера и деплоя готового проекта.", tags: ["Full-stack", "Frontend", "Backend"], initials: "AZ", color: "from-amber-500 to-orange-600" },
  { id: 5, name: "Saltanat", role: "Наставник по JavaScript и React", bio: "Более 3 лет во фронтенде. JavaScript и React: компонентная архитектура, работа с API и вёрстка под любые экраны.", tags: ["JavaScript", "React", "Frontend"], initials: "SA", color: "from-pink-500 to-rose-700" },
  { id: 6, name: "Erjan", role: "Python / AI-разработчик", bio: "Более 2 лет в Python-разработке. Django, работа с данными и AI-сервисами, backend для веб-приложений.", tags: ["Python", "Django", "AI"], initials: "ER", color: "from-blue-500 to-blue-700" },
  { id: 7, name: "Mirbek", role: "Full-stack разработчик", bio: "Full-stack разработка от вёрстки до сервера. Помогает студентам собрать и опубликовать первый рабочий проект.", tags: ["Full-stack", "JavaScript", "Web"], initials: "MI", color: "from-teal-500 to-teal-700" },
];

/** Served when the site-content row cannot be read; mirrors the schema defaults. */
export const FALLBACK_SITE_CONTENT: SiteContent = {
  id: "site",
  aboutTitle: "",
  aboutBody: "",
  statStudents: 2500,
  statEmployed: 95,
  statYears: 3,
  contactEmail: "hello@itadis.edu",
  contactPhone: "+996 (700) 123-456",
  contactAddress: "Bishkek, Kyrgyzstan",
  updatedAt: new Date().toISOString(),
};
