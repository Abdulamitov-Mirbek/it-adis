import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationStatus } from "@prisma/client";

@ApiTags("applications")
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: "Submit a new course application" })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all applications (admin)" })
  findAll() {
    return this.applicationsService.findAll();
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update application status" })
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: ApplicationStatus
  ) {
    return this.applicationsService.updateStatus(id, status);
  }
}
