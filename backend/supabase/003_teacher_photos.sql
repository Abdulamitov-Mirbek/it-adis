-- Teacher photos.
--
-- Nullable on purpose: a teacher without a photo falls back to the initials
-- badge the cards already render, so adding a mentor never blocks on having a
-- headshot ready. The column holds a public Supabase Storage URL, not the image
-- bytes — Postgres is the wrong place for binaries, and the storage CDN serves
-- them far better than PostgREST would.

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
