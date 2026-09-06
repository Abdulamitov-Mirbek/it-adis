/**
 * Seeds the mentor roster and the storage bucket their photos live in.
 *
 *   cd backend && npm run seed:teachers
 *   npm run seed:teachers -- --photo "Bayastan=../photo.jpg"
 *   npm run seed:teachers -- --replace
 *
 * Safe to re-run: mentors are matched by name and updated in place, so a second
 * run never duplicates a card and never discards a photo uploaded through the
 * admin panel. `--replace` additionally deletes mentors that are not in this
 * file — use it when the roster here is meant to be the whole truth.
 *
 * Lives under src/ for the same reason seed.ts does: it compiles into dist/ and
 * so can run against the deployed stack, where there is no ts-node.
 */
import { supabase, nowIso, check } from "./env";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { basename, extname } from "path";

const BUCKET = "teacher-photos";

interface Mentor {
  name: string;
  role: string;
  bio: string;
  tags: string[];
  initials: string;
  color: string;
  order: number;
}

/**
 * Bios are Russian and deliberately short — two sentences at most. The cards
 * sit in a four-column grid, and anything longer pushes the tag row and the
 * social icons out of alignment between cards.
 *
 * Written as noun phrases rather than past-tense verbs, which in Russian would
 * force a gendered form for every mentor.
 */
const MENTORS: Mentor[] = [
  {
    name: "Bayastan",
    role: "Flutter-разработчик, Middle+",
    bio: "Более 5 лет в мобильной разработке. Flutter и Dart, архитектура приложений, релизы в App Store и Google Play.",
    tags: ["Flutter", "Dart", "Mobile"],
    initials: "BA",
    color: "from-cyan-500 to-sky-700",
    order: 1,
  },
  {
    name: "Adyl",
    role: "Senior Python-разработчик",
    bio: "Более 5 лет в backend-разработке на Python. Чистый код, проектирование сервисов и разбор реальных production-задач.",
    tags: ["Python", "Backend", "Senior"],
    initials: "AD",
    color: "from-green-500 to-emerald-700",
    order: 2,
  },
  {
    name: "Guldana",
    role: "Frontend-разработчик",
    bio: "Более 4 лет во фронтенде. React, Vue и Angular — помогает выбрать инструмент под задачу и не бояться нового фреймворка.",
    tags: ["React", "Vue", "Angular"],
    initials: "GU",
    color: "from-violet-500 to-purple-700",
    order: 3,
  },
  {
    name: "Azamat",
    role: "Full-stack разработчик",
    bio: "Более 4 лет во full-stack разработке. Ведёт студентов от вёрстки до сервера и деплоя готового проекта.",
    tags: ["Full-stack", "Frontend", "Backend"],
    initials: "AZ",
    color: "from-amber-500 to-orange-600",
    order: 4,
  },
  {
    name: "Saltanat",
    role: "Наставник по JavaScript и React",
    bio: "Более 3 лет во фронтенде. JavaScript и React: компонентная архитектура, работа с API и вёрстка под любые экраны.",
    tags: ["JavaScript", "React", "Frontend"],
    initials: "SA",
    color: "from-pink-500 to-rose-700",
    order: 5,
  },
  {
    name: "Erjan",
    role: "Python / AI-разработчик",
    bio: "Более 2 лет в Python-разработке. Django, работа с данными и AI-сервисами, backend для веб-приложений.",
    tags: ["Python", "Django", "AI"],
    initials: "ER",
    color: "from-blue-500 to-blue-700",
    order: 6,
  },
  {
    // Experience deliberately not stated. Six months next to colleagues with
    // three to five years invites exactly the comparison a prospective student
    // should not be making on a pricing decision; the role says what he teaches
    // without inviting it. Change this line, not the number, if that is wrong.
    name: "Mirbek",
    role: "Full-stack разработчик",
    bio: "Full-stack разработка от вёрстки до сервера. Помогает студентам собрать и опубликовать первый рабочий проект.",
    tags: ["Full-stack", "JavaScript", "Web"],
    initials: "MI",
    color: "from-teal-500 to-teal-700",
    order: 7,
  },
];

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** `--photo "Name=path"`, repeatable. */
function parsePhotoArgs(argv: string[]): Map<string, string> {
  const photos = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--photo") continue;
    const pair = argv[i + 1];
    if (!pair || !pair.includes("=")) {
      throw new Error('--photo expects "Name=path/to/image.jpg"');
    }
    photos.set(pair.slice(0, pair.indexOf("=")).trim(), pair.slice(pair.indexOf("=") + 1).trim());
  }
  return photos;
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  check("list storage buckets", error);

  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    console.log(`  ✓ Bucket ${BUCKET} already exists`);
    return;
  }

  // Public: these are headshots on a marketing page, so they are served from
  // the storage CDN rather than through signed URLs the API would have to mint
  // on every page load.
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  check(`create bucket ${BUCKET}`, createError);
  console.log(`  ✓ Created public bucket ${BUCKET}`);
}

async function uploadPhoto(teacherId: string, filePath: string): Promise<string> {
  const extension = extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    throw new Error(`${basename(filePath)}: only .jpg, .png and .webp are supported`);
  }

  const body = readFileSync(filePath);
  const objectPath = `${teacherId}/${randomUUID()}${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, body, { contentType, upsert: false });
  check(`upload ${basename(filePath)}`, error);

  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function main() {
  const argv = process.argv.slice(2);
  const replace = argv.includes("--replace");
  const photos = parsePhotoArgs(argv);

  console.log("\n🧑‍🏫 Seeding mentors...");
  await ensureBucket();

  for (const mentor of MENTORS) {
    const { data: existing, error: findError } = await supabase
      .from("teachers")
      .select("id, photoUrl")
      .eq("name", mentor.name)
      .maybeSingle();
    check(`look up ${mentor.name}`, findError);

    const id = existing?.id ?? randomUUID();
    const photoPath = photos.get(mentor.name);
    // An existing photo is never overwritten unless a new file is passed, so
    // re-running this does not wipe a headshot uploaded from the admin panel.
    const photoUrl = photoPath
      ? await uploadPhoto(id, photoPath)
      : existing?.photoUrl ?? null;

    if (existing) {
      const { error } = await supabase
        .from("teachers")
        .update({ ...mentor, photoUrl, isActive: true, updatedAt: nowIso() })
        .eq("id", id);
      check(`update ${mentor.name}`, error);
    } else {
      const now = nowIso();
      const { error } = await supabase.from("teachers").insert({
        id,
        ...mentor,
        photoUrl,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      check(`insert ${mentor.name}`, error);
    }

    console.log(`  ✓ ${mentor.name}${photoPath ? " (photo uploaded)" : ""}`);
  }

  if (replace) {
    const keep = MENTORS.map((mentor) => mentor.name);
    const { data: removed, error } = await supabase
      .from("teachers")
      .delete()
      .not("name", "in", `(${keep.map((name) => `"${name}"`).join(",")})`)
      .select("name");
    check("remove mentors not in this file", error);
    for (const row of removed ?? []) {
      console.log(`  ✓ Removed ${row.name}`);
    }
  }

  console.log("✅ Mentors seeded\n");
}

main().catch((e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : e}\n`);
  // Not process.exit: supabase-js still holds sockets, and tearing the process
  // down under them trips a libuv assertion on Windows and loses the exit code.
  process.exitCode = 1;
});
