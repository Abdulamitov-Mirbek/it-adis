import { PartialType } from "@nestjs/swagger";
import { CreateCourseDto } from "./create-course.dto";

/**
 * PATCH body for a course.
 *
 * This exists because the controller previously typed the body as
 * `Partial<CreateCourseDto>`. TypeScript erases that to plain `Object` at
 * runtime, so ValidationPipe found no metatype to validate against and skipped
 * the request entirely — no type checks, no whitelisting, nothing. PartialType
 * builds a real class with the parent's decorators reapplied as optional, so
 * the pipe has something to enforce.
 */
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
