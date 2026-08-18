import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateApplicationDto {
  @ApiProperty({ example: "Kamila Asanova" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: "kamila@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: "+996 700 123 456" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: "Python Development" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  program: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
