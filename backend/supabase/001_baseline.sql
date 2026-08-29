-- Baseline schema for the IT ADIS database.
--
-- This is a RECORD of the tables as they already exist in Supabase, not
-- something the deploy runs. The tables were originally created by Prisma
-- (`prisma db push`), which is why the identifiers are camelCase and quoted
-- while the table names are snake_case. Prisma has been removed; this file and
-- 002_admin_managed_content.sql are what is left to describe the shape the
-- backend expects.
--
-- Two Prisma behaviours are now the application's job, and the columns show it:
--   * "id" is TEXT with no default — Prisma generated cuids client-side.
--     newId() in src/supabase/supabase.service.ts supplies one per insert.
--   * "updatedAt" is NOT NULL with no default — Prisma's @updatedAt.
--     Every insert and update in the services sets it explicitly.
--
-- Run this only when standing up a brand new Supabase project.

CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "CourseLevel"       AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

CREATE TABLE "courses" (
    "id"          TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDesc"    TEXT,
    "duration"    TEXT NOT NULL,
    "level"       "CourseLevel" NOT NULL,
    "price"       INTEGER NOT NULL,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "isFeatured"  BOOLEAN NOT NULL DEFAULT false,
    "order"       INTEGER NOT NULL DEFAULT 0,
    "tags"        TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

CREATE TABLE "applications" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "phone"     TEXT,
    "message"   TEXT,
    "program"   TEXT NOT NULL,
    "status"    "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId"  TEXT,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id"),
    -- The embed `course:courses(*)` in the services resolves through this
    -- foreign key. Drop it and PostgREST stops being able to join the two.
    CONSTRAINT "applications_courseId_fkey" FOREIGN KEY ("courseId")
        REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "admin_users" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
