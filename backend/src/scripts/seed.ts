/**
 * Seeds the course catalogue and the default admin user.
 *
 * Locally:   cd backend && SEED_ADMIN_PASSWORD='...' npm run seed
 * In Docker: docker compose -f docker-compose.prod.yml --env-file .env.production  *              run --rm --no-deps -e SEED_ADMIN_PASSWORD='...'  *              backend node dist/scripts/seed.js
 *
 * It lives under src/ rather than a top-level scripts/ directory for exactly
 * that second form: everything under src/ is compiled into dist/, so the seed
 * ships inside the runtime image and can be run against the deployed stack. A
 * top-level scripts/ would need ts-node, which the production image does not
 * have. It imports nothing from Nest, so it costs the API nothing at runtime.
 *
 * Replaces prisma/seed.ts. Safe to re-run: each row is looked up first and
 * updated in place, so re-seeding never changes a course's id — applications
 * point at those ids through applications."courseId".
 */
import { randomUUID } from "crypto";
import * as bcrypt from "bcryptjs";
import { supabase, nowIso, check } from "./env";

const courses = [
  {
    slug: "python-development",
    title: "Python Development",
    description: "From basics to advanced — data manipulation, automation, web scraping, and building APIs.",
    longDesc: "A comprehensive Python course covering OOP, data structures, web scraping, REST APIs with FastAPI, and automation scripts.",
    duration: "4 months",
    level: "BEGINNER",
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
    level: "BEGINNER",
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
    level: "INTERMEDIATE",
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
    level: "ALL_LEVELS",
    price: 20000,
    isFeatured: false,
    order: 4,
    tags: ["AI", "LLMs", "Productivity", "Vibe Coding"],
  },
];

async function main() {
  console.log("🌱 Seeding Supabase...");

  for (const course of courses) {
    const { data: existing, error: findError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", course.slug)
      .maybeSingle();
    check(`look up course ${course.slug}`, findError);

    if (existing) {
      // Deliberately does not touch "id": applications reference it.
      const { error } = await supabase
        .from("courses")
        .update({ ...course, updatedAt: nowIso() })
        .eq("slug", course.slug);
      check(`update course ${course.slug}`, error);
    } else {
      const now = nowIso();
      const { error } = await supabase
        .from("courses")
        .insert({ id: randomUUID(), ...course, createdAt: now, updatedAt: now });
      check(`insert course ${course.slug}`, error);
    }

    console.log(`  ✓ Course: ${course.title}`);
  }

  // The old seed hardcoded this password, and that value is in the git history
  // of a public repository — anyone who read the source could log into the
  // admin panel of any deployment that kept the default. Set SEED_ADMIN_PASSWORD.
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@itadis.edu";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    console.error(
      "\n✗ SEED_ADMIN_PASSWORD is not set.\n" +
        "  Courses were seeded; the admin user was not.\n" +
        "  Pick a password nobody can read out of this repository and re-run:\n\n" +
        '    SEED_ADMIN_PASSWORD="..." npm run seed\n'
    );
    // Not process.exit: see the note on the catch below.
    process.exitCode = 1;
    return;
  }

  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  const { data: existingAdmin, error: adminFindError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", adminEmail)
    .maybeSingle();
  check("look up admin user", adminFindError);

  if (existingAdmin) {
    const { error } = await supabase
      .from("admin_users")
      .update({ passwordHash, name: "IT ADIS Admin", updatedAt: nowIso() })
      .eq("email", adminEmail);
    check("update admin user", error);
  } else {
    const now = nowIso();
    const { error } = await supabase.from("admin_users").insert({
      id: randomUUID(),
      email: adminEmail,
      passwordHash,
      name: "IT ADIS Admin",
      createdAt: now,
      updatedAt: now,
    });
    check("insert admin user", error);
  }

  console.log(`  ✓ Admin user: ${adminEmail}`);
  console.log("✅ Seed complete");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  // Not process.exit(1): by this point supabase-js is holding open sockets, and
  // tearing the process down underneath them trips a libuv assertion on Windows
  // ("UV_HANDLE_CLOSING", src/win/async.c) which replaces the exit code with
  // 127. Setting exitCode and letting the loop drain takes under a second and
  // reports the failure correctly.
  process.exitCode = 1;
});
