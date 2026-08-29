import { Injectable } from '@nestjs/common';
import { SupabaseService, unwrap, unwrapCount } from '../supabase/supabase.service';
import { Application, ApplicationStatus, Course, TABLES } from '../supabase/types';

/** PostgREST returns an aggregate embed as `applications: [{ count: n }]`. */
type CourseWithApplicationCount = Course & { applications?: Array<{ count: number }> };

@Injectable()
export class AdminService {
  constructor(private db: SupabaseService) {}

  /** `head: true` fetches no rows at all — only the Content-Range count header. */
  private count(table: string, apply?: (q: any) => any) {
    const base = this.db.from(table).select('*', { count: 'exact', head: true });
    return apply ? apply(base) : base;
  }

  async getDashboardStats() {
    const [
      totalCourses,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      unreadApplications,
    ] = await Promise.all([
      this.count(TABLES.courses, (q) => q.eq('isActive', true)),
      this.count(TABLES.applications),
      this.count(TABLES.applications, (q) => q.eq('status', ApplicationStatus.PENDING)),
      this.count(TABLES.applications, (q) => q.eq('status', ApplicationStatus.ACCEPTED)),
      this.count(TABLES.applications, (q) => q.eq('status', ApplicationStatus.REJECTED)),
      this.count(TABLES.applications, (q) => q.eq('isRead', false)),
    ]).then((results) =>
      results.map((r, i) => unwrapCount(r, `admin.dashboard[${i}]`)),
    );

    return {
      totalCourses,
      totalApplications,
      unreadApplications,
      applicationsByStatus: {
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
      },
      acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(1) : 0,
    };
  }

  async getCourses(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // One request, not two: asking for `count: 'exact'` alongside a ranged
    // select returns the page and the unpaginated total together, which is what
    // Prisma needed a second `count()` query for.
    const result = await this.db
      .from(TABLES.courses)
      .select('*, applications(count)', { count: 'exact' })
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    const rows = unwrap<CourseWithApplicationCount[]>(result, 'admin.getCourses');
    const total = result.count ?? 0;

    return {
      courses: rows.map(({ applications, ...course }) => ({
        ...course,
        // Kept in Prisma's shape so the admin panel needs no change.
        _count: { applications: applications?.[0]?.count ?? 0 },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getApplications(page: number = 1, limit: number = 10, status?: ApplicationStatus) {
    const skip = (page - 1) * limit;

    let query = this.db
      .from(TABLES.applications)
      .select('*, course:courses(title, slug)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status);

    const result = await query;
    const applications = unwrap<Application[]>(result, 'admin.getApplications');
    const total = result.count ?? 0;

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentActivity() {
    const recentApplications = unwrap<
      Array<Application & { course: { title: string } | null }>
    >(
      await this.db
        .from(TABLES.applications)
        .select('*, course:courses(title)')
        .order('createdAt', { ascending: false })
        .limit(5),
      'admin.getRecentActivity',
    );

    return {
      recentApplications: recentApplications.map(app => ({
        id: app.id,
        applicantName: app.name,
        courseName: app.course?.title || 'General Inquiry',
        status: app.status,
        createdAt: app.createdAt,
      })),
    };
  }
}
