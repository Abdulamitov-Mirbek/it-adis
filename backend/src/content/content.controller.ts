import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { THROTTLE_ANALYTICS } from "../config/throttle";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ContentService } from "./content.service";
import {
  CreateReviewDto,
  CreateTeacherDto,
  TrackPageViewDto,
  UpdateSiteContentDto,
} from "./dto/content.dto";
import { UpdateReviewDto, UpdateTeacherDto } from "./dto/update-content.dto";

/**
 * The shape multer hands back, declared locally rather than pulled in from
 * @types/multer — the package is not a dependency here and these four fields
 * are all the upload handler touches.
 */
interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

/**
 * Admin-managed content: teachers, reviews, the About copy and traffic.
 *
 * Reads that feed the public site stay open; every write is behind the admin
 * guard. The one exception is POST /analytics/track, which the browser calls
 * on each page view and therefore cannot be authenticated.
 */
@ApiTags("content")
@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ── Teachers ──────────────────────────────────────────────────────────────

  @Get("teachers")
  @ApiOperation({ summary: "List teachers shown on the website" })
  findPublicTeachers() {
    return this.contentService.findPublicTeachers();
  }

  @Get("admin/teachers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all teachers, archived included (admin)" })
  findAllTeachers() {
    return this.contentService.findAllTeachers();
  }

  @Post("teachers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a teacher (admin)" })
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.contentService.createTeacher(dto);
  }

  @Patch("teachers/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a teacher (admin)" })
  updateTeacher(@Param("id") id: string, @Body() dto: UpdateTeacherDto) {
    return this.contentService.updateTeacher(id, dto);
  }

  @Delete("teachers/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove a teacher (admin)" })
  removeTeacher(@Param("id") id: string) {
    return this.contentService.removeTeacher(id);
  }

  /**
   * Multipart rather than a base64 field: the global JSON body limit is 100 kB,
   * which even a small headshot exceeds once base64 inflates it by a third.
   * The size cap here is the same one the service enforces, applied earlier so
   * an oversized upload is rejected before it is buffered in full.
   */
  @Post("teachers/:id/photo")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a teacher photo (admin)" })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: ContentService.MAX_PHOTO_BYTES } })
  )
  uploadTeacherPhoto(
    @Param("id") id: string,
    @UploadedFile() file: UploadedImage
  ) {
    if (!file) {
      throw new BadRequestException("No file was uploaded under the field 'file'.");
    }
    return this.contentService.uploadTeacherPhoto(id, file);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  @Get("reviews")
  @ApiOperation({ summary: "List published reviews" })
  findPublicReviews() {
    return this.contentService.findPublicReviews();
  }

  @Get("admin/reviews")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all reviews, unpublished included (admin)" })
  findAllReviews() {
    return this.contentService.findAllReviews();
  }

  @Post("reviews")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a review (admin)" })
  createReview(@Body() dto: CreateReviewDto) {
    return this.contentService.createReview(dto);
  }

  @Patch("reviews/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a review (admin)" })
  updateReview(@Param("id") id: string, @Body() dto: UpdateReviewDto) {
    return this.contentService.updateReview(id, dto);
  }

  @Delete("reviews/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove a review (admin)" })
  removeReview(@Param("id") id: string) {
    return this.contentService.removeReview(id);
  }

  // ── Site content ──────────────────────────────────────────────────────────

  @Get("site-content")
  @ApiOperation({ summary: "Editable About copy, stats and contact details" })
  getSiteContent() {
    return this.contentService.getSiteContent();
  }

  @Patch("site-content")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update site content (admin)" })
  updateSiteContent(@Body() dto: UpdateSiteContentDto) {
    return this.contentService.updateSiteContent(dto);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  @Post("analytics/track")
  @Throttle(THROTTLE_ANALYTICS)
  @ApiOperation({ summary: "Record a page view (called by the browser)" })
  track(@Body() dto: TrackPageViewDto) {
    return this.contentService.trackPageView(dto);
  }

  @Get("admin/analytics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Traffic summary (admin)" })
  @ApiQuery({ name: "days", required: false, type: Number })
  getAnalytics(@Query("days") days?: string) {
    const parsed = days ? parseInt(days, 10) : 30;
    // Clamped so a hand-edited query string cannot ask for an unbounded scan.
    const window = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 365) : 30;
    return this.contentService.getAnalytics(window);
  }
}
