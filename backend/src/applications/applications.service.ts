import { Injectable } from "@nestjs/common";
import {
  SupabaseService,
  newId,
  nowIso,
  unwrap,
  unwrapCount,
} from "../supabase/supabase.service";
import { Application, ApplicationStatus, TABLES } from "../supabase/types";
import { CreateApplicationDto } from "./dto/create-application.dto";

@Injectable()
export class ApplicationsService {
  constructor(private db: SupabaseService) {}

  async create(dto: CreateApplicationDto) {
    const now = nowIso();
    const application = unwrap<Application>(
      await this.db
        .from(TABLES.applications)
        .insert({
          id:        newId(),
          name:      dto.name,
          email:     dto.email,
          phone:     dto.phone ?? null,
          program:   dto.program,
          message:   dto.message ?? null,
          status:    ApplicationStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single(),
      "applications.create"
    );

    console.log(
      `📬 New application from ${application.name} <${application.email}> for "${application.program}"`
    );

    return {
      success: true,
      id: application.id,
      message: "Application received. We will contact you within 24 hours.",
    };
  }

  async findAll() {
    // `course:courses(*)` is PostgREST's embed over the applications.courseId
    // foreign key, aliased so the JSON keeps the `course` key the admin panel
    // already reads (Prisma's `include: { course: true }`).
    return unwrap<Application[]>(
      await this.db
        .from(TABLES.applications)
        .select("*, course:courses(*)")
        .order("createdAt", { ascending: false }),
      "applications.findAll"
    );
  }

  async updateStatus(id: string, status: ApplicationStatus) {
    // Acting on an application implies it has been seen, so moving it out of
    // PENDING also clears the unread badge. Otherwise an administrator who
    // works entirely from the status dropdown never clears the counter.
    return unwrap<Application>(
      await this.db
        .from(TABLES.applications)
        .update({ status, isRead: true, readAt: nowIso(), updatedAt: nowIso() })
        .eq("id", id)
        .select()
        .single(),
      "applications.updateStatus"
    );
  }

  async markRead(id: string, isRead: boolean) {
    return unwrap<Application>(
      await this.db
        .from(TABLES.applications)
        .update({
          isRead,
          readAt: isRead ? nowIso() : null,
          updatedAt: nowIso(),
        })
        .eq("id", id)
        .select()
        .single(),
      "applications.markRead"
    );
  }

  /** Drives the sidebar badge. */
  async countUnread(): Promise<number> {
    return unwrapCount(
      await this.db
        .from(TABLES.applications)
        .select("*", { count: "exact", head: true })
        .eq("isRead", false),
      "applications.countUnread"
    );
  }
}
