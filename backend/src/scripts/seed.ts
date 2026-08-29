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
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import * as bcrypt from "bcryptjs";

// ── Environment ───────────────────────────────────────────────────────────────
// In Docker (and under systemd) the variables are already in the environment,
// and there is no .env file — the read below just misses and this does nothing.
// Run by hand from backend/ it reads backend/.env, parsed the same way
// deploy-native.sh does it: no shell expansion, so a key containing `$`
// survives intact.
//
// Resolved from the working directory, not from __dirname: this file runs from
// src/scripts under ts-node and from dist/scripts once compiled, so a relative
// path would point somewhere different in each case.
function loadDotEnv() {
  let raw: string;
  try {
    raw = readFileSync(join(process.cwd(), ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) continue;
    const key = line.slice(0, line.indexOf("=")).trim();
    let value = line.slice(line.indexOf("=") + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "SUPABASE_URL and SUPABASE_SECRET_KEY must be set (backend/.env or the environment)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const nowIso = () => new Date().toISOString();

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

/** Throws rather than letting supabase-js return a silent `{ error }`. */
function check(context: string, error: { message: string } | null) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

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
    process.exit(1);
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
  process.exit(1);
});
