import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { THROTTLE_APPLICATION } from "../config/throttle";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationStatus } from "@prisma/client";

@ApiTags("applications")
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /** The only public route here — prospective students submitting the form. */
  @Post()
  @Throttle(THROTTLE_APPLICATION)
  @ApiOperation({ summary: "Submit a new course application" })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  // ── Admin only ──────────────────────────────────────────────────────────
  // This listing returns every applicant's name, email address and phone
  // number. It was previously served to anyone who requested it.

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all applications (admin)" })
  findAll() {
    return this.applicationsService.findAll();
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update application status (admin)" })
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: ApplicationStatus
  ) {
    return this.applicationsService.updateStatus(id, status);
  }

  @Patch(":id/read")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark an application read or unread (admin)" })
  markRead(@Param("id") id: string, @Body("isRead") isRead?: boolean) {
    return this.applicationsService.markRead(id, isRead !== false);
  }
}
