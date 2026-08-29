import { IsString, IsInt, IsBoolean, IsOptional, IsEnum, IsArray } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CourseLevel } from "@prisma/client";

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  longDesc?: string;

  @ApiProperty()
  @IsString()
  duration: string;

  @ApiProperty({ enum: CourseLevel })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty()
  @IsInt()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  // The admin course dialog has always sent this; it was missing from the DTO,
  // so `whitelist` silently dropped it and toggling a course active or inactive
  // did nothing. With `forbidNonWhitelisted` on it would have started 400ing.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
