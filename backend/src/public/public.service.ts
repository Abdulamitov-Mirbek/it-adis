import { Injectable } from '@nestjs/common';
import { SupabaseService, unwrapCount } from '../supabase/supabase.service';
import { TABLES } from '../supabase/types';
import { ContentService } from '../content/content.service';

/**
 * The public endpoints the marketing site reads.
 *
 * Teachers, reviews and the headline figures now come from the database so an
 * administrator can change them without a deploy. While those tables are still
 * empty — right after the migration, before anything has been entered — the
 * original hardcoded content is served instead, so the site never renders an
 * empty Teachers or Reviews section during the changeover.
 */
@Injectable()
export class PublicService {
  constructor(
    private db: SupabaseService,
    private content: ContentService,
  ) {}

  async getStats() {
    const [
      totalApplications,
      activeCourses,
    ] = await Promise.all([
      // head: true asks PostgREST for the count header and no rows at all.
      this.db
        .from(TABLES.applications)
        .select('*', { count: 'exact', head: true })
        .then((r) => unwrapCount(r, 'public.totalApplications')),
      this.db
        .from(TABLES.courses)
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true)
        .then((r) => unwrapCount(r, 'public.activeCourses')),
    ]);

    const siteContent = await this.content.getSiteContent();

    return {
      // Admin-managed, with the old estimate as the floor so the number never
      // reads lower than the applications actually received.
      students: Math.max(siteContent.statStudents, totalApplications * 3),
      employed: siteContent.statEmployed,
      // Always computed: a stored count would drift the moment a course is
      // archived from the admin panel.
      courses: activeCourses,
      years: siteContent.statYears,
    };
  }

  async getReviews() {
    const stored = await this.content.findPublicReviews();
    return stored.length > 0 ? stored : this.seedReviews;
  }

  async getTeachers() {
    const stored = await this.content.findPublicTeachers();
    return stored.length > 0 ? stored : this.seedTeachers;
  }

  /** Shown only while the reviews table is empty. */
  private readonly seedReviews = [
      { 
        id: 1,
        name: "Kamila Asanova", 
        role: "Frontend Developer @ Epam", 
        initials: "KA", 
        color: "from-green-500 to-emerald-700", 
        stars: 5, 
        text: "IT ADIS changed my life. Before the course I was a barista with zero coding experience. 6 months later I got hired as a junior frontend dev. The projects we built were better than what most bootcamps produce.", 
        course: "Frontend Development" 
      },
      { 
        id: 2,
        name: "Marat Dzhaksybekov", 
        role: "Python Developer @ Kaspi", 
        initials: "MD", 
        color: "from-blue-500 to-blue-700", 
        stars: 5, 
        text: "The Python course is insanely practical. No slides, no theory overload — just building things from day one. My mentor pushed me harder than any university professor ever did. Worth every tenge.", 
        course: "Python Development" 
      },
      { 
        id: 4,
        name: "Alex Chen", 
        role: "Fullstack @ Microsoft", 
        initials: "AC", 
        color: "from-cyan-500 to-cyan-700", 
        stars: 5, 
        text: "Coming from a non-tech background, I was worried about keeping up. The mentorship here is unreal — they don't just teach code, they teach you how to think like a developer.", 
        course: "JavaScript & TypeScript" 
      },
      { 
        id: 6,
        name: "Omar Nazarbayev", 
        role: "Startup CTO", 
        initials: "ON", 
        color: "from-orange-500 to-red-700", 
        stars: 5, 
        text: "The Vibe Coding course taught me AI-assisted development that made me 5x more productive. Now I can prototype ideas in hours instead of weeks. Absolute game-changer for entrepreneurs.", 
        course: "Vibe Coding" 
      },
    ];

  /** Shown only while the teachers table is empty. */
  private readonly seedTeachers = [
      { 
        id: 1,
        name: "Amir Seitkali", 
        role: "Lead Python & AI Instructor", 
        bio: "10 years in ML engineering. Previously at Google DeepMind. Built production ML systems serving 50M+ users.", 
        tags: ["Python", "ML", "NLP"], 
        initials: "AS", 
        color: "from-green-500 to-emerald-700" 
      },
      { 
        id: 2,
        name: "Diana Kozyreva", 
        role: "Frontend & React Expert", 
        bio: "Senior frontend engineer, 8 years. Ex-Figma, open-source UI libraries with 12k stars.", 
        tags: ["React", "Next.js", "TypeScript"], 
        initials: "DK", 
        color: "from-blue-500 to-blue-700" 
      },
      { 
        id: 3,
        name: "Viktor Petrov", 
        role: "AI & Machine Learning Lead", 
        bio: "PhD in Computer Science, 12 years in AI research. Former Tesla Autopilot team member. Published 30+ papers.", 
        tags: ["Deep Learning", "Computer Vision", "PyTorch"], 
        initials: "VP", 
        color: "from-purple-500 to-purple-700" 
      },
    ];
}
