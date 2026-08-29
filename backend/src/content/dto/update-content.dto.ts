import { PartialType } from "@nestjs/swagger";
import { CreateReviewDto, CreateTeacherDto } from "./content.dto";

/**
 * PATCH bodies for teachers and reviews. See update-course.dto.ts — the
 * controllers used `Partial<...>`, which ValidationPipe cannot see at runtime,
 * leaving both update endpoints completely unvalidated.
 */
export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {}
export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
