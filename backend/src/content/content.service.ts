import { Injectable, NotFoundException } from "@nestjs/common";
import {
  SupabaseService,
  newId,
  nowIso,
  unwrap,
  unwrapCount,
} from "../supabase/supabase.service";
import { PageView, Review, SiteContent, TABLES, Teacher } from "../supabase/types";
import {
  CreateReviewDto,
  CreateTeacherDto,
  TrackPageViewDto,
  UpdateSiteContentDto,
} from "./dto/content.dto";

/** Fallback initials so the admin form never forces the field. */
function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

@Injectable()
export class ContentService {
  constructor(private db: SupabaseService) {}

  // ── Teachers ──────────────────────────────────────────────────────────────

  /** Public listing: active only, in display order. */
  async findPublicTeachers(): Promise<Teacher[]> {
    return unwrap<Teacher[]>(
      await this.db
        .from(TABLES.teachers)
        .select("*")
        .eq("isActive", true)
        .order("order", { ascending: true })
        .order("createdAt", { ascending: true }),
      "content.findPublicTeachers"
    );
  }

  /** Admin listing: everything, archived included. */
  async findAllTeachers(): Promise<Teacher[]> {
    return unwrap<Teacher[]>(
      await this.db
        .from(TABLES.teachers)
        .select("*")
        .order("order", { ascending: true })
        .order("createdAt", { ascending: true }),
      "content.findAllTeachers"
    );
  }

  async createTeacher(dto: CreateTeacherDto): Promise<Teacher> {
    const now = nowIso();
    return unwrap<Teacher>(
      await this.db
        .from(TABLES.teachers)
        .insert({
          id: newId(),
          ...dto,
          tags: dto.tags ?? [],
          initials: dto.initials || initialsFrom(dto.name),
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single(),
      "content.createTeacher"
    );
  }

  async updateTeacher(id: string, dto: Partial<CreateTeacherDto>): Promise<Teacher> {
    await this.assertExists("teacher", id);
    return unwrap<Teacher>(
      await this.db
        .from(TABLES.teachers)
        .update({
          ...dto,
          // Keep initials in step with a renamed teacher unless set explicitly.
          ...(dto.name && !dto.initials ? { initials: initialsFrom(dto.name) } : {}),
          updatedAt: nowIso(),
        })
        .eq("id", id)
        .select()
        .single(),
      "content.updateTeacher"
    );
  }

  async removeTeacher(id: string): Promise<Teacher> {
    await this.assertExists("teacher", id);
    return unwrap<Teacher>(
      await this.db.from(TABLES.teachers).delete().eq("id", id).select().single(),
      "content.removeTeacher"
    );
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  async findPublicReviews(): Promise<Review[]> {
    return unwrap<Review[]>(
      await this.db
        .from(TABLES.reviews)
        .select("*")
        .eq("isPublished", true)
        .order("order", { ascending: true })
        .order("createdAt", { ascending: false }),
      "content.findPublicReviews"
    );
  }

  async findAllReviews(): Promise<Review[]> {
    return unwrap<Review[]>(
      await this.db
        .from(TABLES.reviews)
        .select("*")
        .order("order", { ascending: true })
        .order("createdAt", { ascending: false }),
      "content.findAllReviews"
    );
  }

  async createReview(dto: CreateReviewDto): Promise<Review> {
    const now = nowIso();
    return unwrap<Review>(
      await this.db
        .from(TABLES.reviews)
        .insert({
          id: newId(),
          ...dto,
          initials: dto.initials || initialsFrom(dto.name),
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single(),
      "content.createReview"
    );
  }

  async updateReview(id: string, dto: Partial<CreateReviewDto>): Promise<Review> {
    await this.assertExists("review", id);
    return unwrap<Review>(
      await this.db
        .from(TABLES.reviews)
        .update({
          ...dto,
          ...(dto.name && !dto.initials ? { initials: initialsFrom(dto.name) } : {}),
          updatedAt: nowIso(),
        })
        .eq("id", id)
        .select()
        .single(),
      "content.updateReview"
    );
  }

  async removeReview(id: string): Promise<Review> {
    await this.assertExists("review", id);
    return unwrap<Review>(
      await this.db.from(TABLES.reviews).delete().eq("id", id).select().single(),
      "content.removeReview"
    );
  }

  // ── Site content ──────────────────────────────────────────────────────────

  /**
   * The singleton row, created on first read so neither the admin panel nor
   * the public site has to handle "not configured yet" as a special case.
   *
   * Read-then-create rather than a plain upsert: an upsert would have to write
   * `updatedAt` on every read, which turns a page load into a write and makes
   * the "last edited" timestamp meaningless.
   */
  async getSiteContent(): Promise<SiteContent> {
    const existing = unwrap<SiteContent | null>(
      await this.db.from(TABLES.siteContent).select("*").eq("id", "site").maybeSingle(),
      "content.getSiteContent"
    );
    if (existing) return existing;

    // Every other column has a database default; only updatedAt needs a value.
    // Upsert rather than insert so two simultaneous first reads cannot collide
    // on the primary key.
    return unwrap<SiteContent>(
      await this.db
        .from(TABLES.siteContent)
        .upsert({ id: "site", updatedAt: nowIso() }, { onConflict: "id" })
        .select()
        .single(),
      "content.createSiteContent"
    );
  }

  async updateSiteContent(dto: UpdateSiteContentDto): Promise<SiteContent> {
    return unwrap<SiteContent>(
      await this.db
        .from(TABLES.siteContent)
        .upsert({ id: "site", ...dto, updatedAt: nowIso() }, { onConflict: "id" })
        .select()
        .single(),
      "content.updateSiteContent"
    );
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  /** PostgREST caps one response at 1000 rows, so pages are read in that size. */
  private static readonly ANALYTICS_PAGE_SIZE = 1000;
  /** Ceiling on how much a single dashboard load may pull back. */
  private static readonly ANALYTICS_MAX_ROWS = 50_000;

  /** Fire-and-forget from the browser beacon. */
  async trackPageView(dto: TrackPageViewDto): Promise<PageView> {
    return unwrap<PageView>(
      await this.db
        .from(TABLES.pageViews)
        .insert({ id: newId(), ...dto })
        .select()
        .single(),
      "content.trackPageView"
    );
  }

  /**
   * Traffic summary for the admin dashboard.
   *
   * "Visitors" counts distinct visitorId values, which are per-session random
   * ids, so the same person returning tomorrow counts twice. That is stated in
   * the UI rather than being quietly presented as unique people.
   *
   * The daily buckets, top pages and visitor count used to be a GROUP BY and a
   * DISTINCT executed in Postgres. PostgREST expresses neither, so the rows in
   * the window are pulled back — three narrow columns only — and bucketed here.
   * That is fine at this site's volume and is capped at ANALYTICS_MAX_ROWS;
   * past that the figures under-report rather than the dashboard hanging. If
   * the table ever outgrows the cap, the fix is a Postgres function called
   * through `rpc()`, not a bigger cap.
   */
  async getAnalytics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalViews, rows] = await Promise.all([
      this.db
        .from(TABLES.pageViews)
        .select("*", { count: "exact", head: true })
        .then((r) => unwrapCount(r, "content.analytics.totalViews")),
      this.pageViewsSince(since),
    ]);

    const visitors = new Set<string>();
    const pageCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();
    let viewsToday = 0;

    for (const row of rows) {
      visitors.add(row.visitorId);
      pageCounts.set(row.path, (pageCounts.get(row.path) ?? 0) + 1);

      if (new Date(row.createdAt) >= startOfToday) viewsToday++;

      // ISO date prefix — the same bucketing date_trunc('day', ...) gave in UTC.
      const day = row.createdAt.slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }

    return {
      totalViews,
      viewsInRange: rows.length,
      viewsToday,
      visitors: visitors.size,
      days,
      topPages: [...pageCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([path, views]) => ({ path, views })),
      daily: [...dayCounts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, views]) => ({ date, views })),
    };
  }

  private async pageViewsSince(
    since: Date
  ): Promise<Array<Pick<PageView, "path" | "visitorId" | "createdAt">>> {
    const { ANALYTICS_PAGE_SIZE, ANALYTICS_MAX_ROWS } = ContentService;
    const rows: Array<Pick<PageView, "path" | "visitorId" | "createdAt">> = [];

    for (let from = 0; from < ANALYTICS_MAX_ROWS; from += ANALYTICS_PAGE_SIZE) {
      const batch = unwrap<Array<Pick<PageView, "path" | "visitorId" | "createdAt">>>(
        await this.db
          .from(TABLES.pageViews)
          .select("path, visitorId, createdAt")
          .gte("createdAt", since.toISOString())
          .order("createdAt", { ascending: true })
          .range(from, from + ANALYTICS_PAGE_SIZE - 1),
        "content.analytics.pageViews"
      );

      rows.push(...batch);
      if (batch.length < ANALYTICS_PAGE_SIZE) break;
    }

    return rows;
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  /**
   * A PostgREST update or delete that matches nothing is not an error — it
   * succeeds with zero rows, which `.single()` then turns into an opaque 500.
   * Checking first turns a bad id into a 404 the admin UI can explain.
   */
  private async assertExists(model: "teacher" | "review", id: string) {
    const table = model === "teacher" ? TABLES.teachers : TABLES.reviews;
    const found = unwrap<{ id: string } | null>(
      await this.db.from(table).select("id").eq("id", id).maybeSingle(),
      `content.assertExists.${model}`
    );

    if (!found) {
      throw new NotFoundException(`No ${model} with id ${id}`);
    }
  }
}
