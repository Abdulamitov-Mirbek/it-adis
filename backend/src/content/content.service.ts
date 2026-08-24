import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
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
  constructor(private prisma: PrismaService) {}

  // ── Teachers ──────────────────────────────────────────────────────────────

  /** Public listing: active only, in display order. */
  findPublicTeachers() {
    return this.prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  /** Admin listing: everything, archived included. */
  findAllTeachers() {
    return this.prisma.teacher.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  createTeacher(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: {
        ...dto,
        tags: dto.tags ?? [],
        initials: dto.initials || initialsFrom(dto.name),
      },
    });
  }

  async updateTeacher(id: string, dto: Partial<CreateTeacherDto>) {
    await this.assertExists("teacher", id);
    return this.prisma.teacher.update({
      where: { id },
      data: {
        ...dto,
        // Keep initials in step with a renamed teacher unless set explicitly.
        ...(dto.name && !dto.initials ? { initials: initialsFrom(dto.name) } : {}),
      },
    });
  }

  async removeTeacher(id: string) {
    await this.assertExists("teacher", id);
    return this.prisma.teacher.delete({ where: { id } });
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  findPublicReviews() {
    return this.prisma.review.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }

  findAllReviews() {
    return this.prisma.review.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }

  createReview(dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: { ...dto, initials: dto.initials || initialsFrom(dto.name) },
    });
  }

  async updateReview(id: string, dto: Partial<CreateReviewDto>) {
    await this.assertExists("review", id);
    return this.prisma.review.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.name && !dto.initials ? { initials: initialsFrom(dto.name) } : {}),
      },
    });
  }

  async removeReview(id: string) {
    await this.assertExists("review", id);
    return this.prisma.review.delete({ where: { id } });
  }

  // ── Site content ──────────────────────────────────────────────────────────

  /**
   * The singleton row, created on first read so neither the admin panel nor
   * the public site has to handle "not configured yet" as a special case.
   */
  getSiteContent() {
    return this.prisma.siteContent.upsert({
      where: { id: "site" },
      update: {},
      create: { id: "site" },
    });
  }

  updateSiteContent(dto: UpdateSiteContentDto) {
    return this.prisma.siteContent.upsert({
      where: { id: "site" },
      update: dto,
      create: { id: "site", ...dto },
    });
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  /** Fire-and-forget from the browser beacon. */
  trackPageView(dto: TrackPageViewDto) {
    return this.prisma.pageView.create({ data: dto });
  }

  /**
   * Traffic summary for the admin dashboard.
   *
   * "Visitors" counts distinct visitorId values, which are per-session random
   * ids, so the same person returning tomorrow counts twice. That is stated in
   * the UI rather than being quietly presented as unique people.
   */
  async getAnalytics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalViews, viewsInRange, viewsToday, visitorRows, topPages, daily] =
      await Promise.all([
        this.prisma.pageView.count(),
        this.prisma.pageView.count({ where: { createdAt: { gte: since } } }),
        this.prisma.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
        this.prisma.pageView.findMany({
          where: { createdAt: { gte: since } },
          select: { visitorId: true },
          distinct: ["visitorId"],
        }),
        this.prisma.pageView.groupBy({
          by: ["path"],
          where: { createdAt: { gte: since } },
          _count: { path: true },
          orderBy: { _count: { path: "desc" } },
          take: 8,
        }),
        // Grouped in SQL rather than in JS: pulling every row back to bucket
        // it by day would not survive the table growing.
        this.prisma.$queryRaw<Array<{ day: Date; views: bigint }>>`
          SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
          FROM "page_views"
          WHERE "createdAt" >= ${since}
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ]);

    return {
      totalViews,
      viewsInRange,
      viewsToday,
      visitors: visitorRows.length,
      days,
      topPages: topPages.map((row) => ({
        path: row.path,
        views: row._count.path,
      })),
      daily: daily.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        views: Number(row.views),
      })),
    };
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  /**
   * Prisma answers a missing row on update/delete with P2025, which Nest turns
   * into an opaque 500. Checking first turns it into a 404 the admin UI can
   * explain.
   */
  private async assertExists(model: "teacher" | "review", id: string) {
    const found =
      model === "teacher"
        ? await this.prisma.teacher.findUnique({ where: { id } })
        : await this.prisma.review.findUnique({ where: { id } });

    if (!found) {
      throw new NotFoundException(`No ${model} with id ${id}`);
    }
  }
}
