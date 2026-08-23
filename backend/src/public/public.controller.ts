import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get public statistics for homepage' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.publicService.getStats();
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get customer reviews/testimonials' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getReviews() {
    return this.publicService.getReviews();
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Get teacher/instructor profiles' })
  @ApiResponse({ status: 200, description: 'Teachers retrieved successfully' })
  async getTeachers() {
    return this.publicService.getTeachers();
  }
}