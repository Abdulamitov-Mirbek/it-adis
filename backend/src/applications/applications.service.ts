import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationStatus } from "@prisma/client";

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateApplicationDto) {
    const application = await this.prisma.application.create({
      data: {
        name:    dto.name,
        email:   dto.email,
        phone:   dto.phone,
        program: dto.program,
        message: dto.message,
        status:  ApplicationStatus.PENDING,
      },
    });

    console.log(
      `📬 New application from ${application.name} <${application.email}> for "${application.program}"`
    );

    return {
      success: true,
      id: application.id,
      message: "Application received. We will contact you within 24 hours.",
    };
  }

  findAll() {
    return this.prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      include: { course: true },
    });
  }

  async updateStatus(id: string, status: ApplicationStatus) {
    // Acting on an application implies it has been seen, so moving it out of
    // PENDING also clears the unread badge. Otherwise an administrator who
    // works entirely from the status dropdown never clears the counter.
    return this.prisma.application.update({
      where: { id },
      data: { status, isRead: true, readAt: new Date() },
    });
  }

  async markRead(id: string, isRead: boolean) {
    return this.prisma.application.update({
      where: { id },
      data: { isRead, readAt: isRead ? new Date() : null },
    });
  }

  /** Drives the sidebar badge. */
  countUnread() {
    return this.prisma.application.count({ where: { isRead: false } });
  }
}
