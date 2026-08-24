import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";

@ApiTags("courses")
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ── Public reads ────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "Get all active courses" })
  @ApiQuery({ name: "featured", required: false, type: Boolean })
  findAll(@Query("featured") featured?: string) {
    return this.coursesService.findAll(featured === "true");
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get course by slug" })
  findOne(@Param("slug") slug: string) {
    return this.coursesService.findOne(slug);
  }

  // ── Admin writes ────────────────────────────────────────────────────────
  // These were previously unauthenticated: anyone who knew the URL could
  // create, rewrite or delete the entire course catalogue with a single curl.

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new course (admin)" })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a course (admin)" })
  update(@Param("slug") slug: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.coursesService.update(slug, dto);
  }

  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Soft-delete a course (admin)" })
  remove(@Param("slug") slug: string) {
    return this.coursesService.remove(slug);
  }
}
