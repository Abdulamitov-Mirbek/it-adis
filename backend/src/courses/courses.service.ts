import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  findAll(featuredOnly?: boolean) {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        ...(featuredOnly ? { isFeatured: true } : {}),
      },
      orderBy: { order: "asc" },
    });
  }

  async findOne(slug: string) {
    const course = await this.prisma.course.findUnique({ where: { slug } });
    if (!course) throw new NotFoundException(`Course "${slug}" not found`);
    return course;
  }

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async update(slug: string, dto: Partial<CreateCourseDto>) {
    await this.findOne(slug);
    return this.prisma.course.update({ where: { slug }, data: dto });
  }

  async remove(slug: string) {
    await this.findOne(slug);
    return this.prisma.course.update({
      where: { slug },
      data: { isActive: false },
    });
  }
}
