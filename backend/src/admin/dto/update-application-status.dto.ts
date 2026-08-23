import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApplicationStatus } from "@prisma/client";

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
