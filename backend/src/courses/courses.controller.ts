import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";

@ApiTags("courses")
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

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

  @Post()
  @ApiOperation({ summary: "Create a new course" })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(":slug")
  @ApiOperation({ summary: "Update a course" })
  update(@Param("slug") slug: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.coursesService.update(slug, dto);
  }

  @Delete(":slug")
  @ApiOperation({ summary: "Soft-delete a course" })
  remove(@Param("slug") slug: string) {
    return this.coursesService.remove(slug);
  }
}
