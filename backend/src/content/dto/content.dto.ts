import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

/**
 * Validation for the admin-managed content.
 *
 * Length caps exist because these strings render on the marketing site: an
 * unbounded bio silently breaks the card grid, and the failure only shows up
 * for visitors, not for the administrator who pasted it.
 */

export class CreateTeacherDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  role: string;

  @IsString()
  @MaxLength(600)
  bio: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  /** Derived from the name when omitted, so the form never demands it. */
  @IsOptional()
  @IsString()
  @MaxLength(4)
  initials?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateReviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(160)
  role: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  text: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @IsString()
  @MaxLength(160)
  course: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  initials?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateSiteContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  aboutTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  aboutBody?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  statStudents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  statEmployed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  statYears?: number;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactAddress?: string;
}

export class TrackPageViewDto {
  @IsString()
  @MaxLength(300)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  referrer?: string;

  /** Random id from the visitor's sessionStorage. Never an IP or a cookie. */
  @IsString()
  @MaxLength(64)
  visitorId: string;
}
