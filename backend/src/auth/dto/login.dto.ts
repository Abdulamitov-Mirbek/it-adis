import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@itadis.edu',
    description: 'Admin email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'itadis_admin_2026',
    description: 'Admin password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}