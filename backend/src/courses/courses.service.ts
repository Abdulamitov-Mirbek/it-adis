import { Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService, newId, nowIso, unwrap } from "../supabase/supabase.service";
import { Course, TABLES } from "../supabase/types";
import { CreateCourseDto } from "./dto/create-course.dto";

@Injectable()
export class CoursesService {
  constructor(private db: SupabaseService) {}

  async findAll(featuredOnly?: boolean): Promise<Course[]> {
    let query = this.db
      .from(TABLES.courses)
      .select("*")
      .eq("isActive", true)
      .order("order", { ascending: true });

    if (featuredOnly) query = query.eq("isFeatured", true);

    return unwrap<Course[]>(await query, "courses.findAll");
  }

  async findOne(slug: string): Promise<Course> {
    // maybeSingle, not single: PostgREST turns "no rows" into an error for
    // single(), which would surface as a 500 instead of the 404 we want.
    const course = unwrap<Course | null>(
      await this.db.from(TABLES.courses).select("*").eq("slug", slug).maybeSingle(),
      "courses.findOne"
    );
    if (!course) throw new NotFoundException(`Course "${slug}" not found`);
    return course;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const now = nowIso();
    return unwrap<Course>(
      await this.db
        .from(TABLES.courses)
        .insert({ id: newId(), ...dto, createdAt: now, updatedAt: now })
        .select()
        .single(),
      "courses.create"
    );
  }

  async update(slug: string, dto: Partial<CreateCourseDto>): Promise<Course> {
    await this.findOne(slug);
    return unwrap<Course>(
      await this.db
        .from(TABLES.courses)
        .update({ ...dto, updatedAt: nowIso() })
        .eq("slug", slug)
        .select()
        .single(),
      "courses.update"
    );
  }

  /** Archive rather than delete, so applications keep pointing at a real row. */
  async remove(slug: string): Promise<Course> {
    await this.findOne(slug);
    return unwrap<Course>(
      await this.db
        .from(TABLES.courses)
        .update({ isActive: false, updatedAt: nowIso() })
        .eq("slug", slug)
        .select()
        .single(),
      "courses.remove"
    );
  }
}
