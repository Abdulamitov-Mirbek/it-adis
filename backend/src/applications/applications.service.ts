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
    return this.prisma.application.update({
      where: { id },
      data: { status },
    });
  }
}
