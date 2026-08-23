import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalCourses,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
    ] = await Promise.all([
      this.prisma.course.count({ where: { isActive: true } }),
      this.prisma.application.count(),
      this.prisma.application.count({ where: { status: ApplicationStatus.PENDING } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.ACCEPTED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.REJECTED } }),
    ]);

    return {
      totalCourses,
      totalApplications,
      applicationsByStatus: {
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
      },
      acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(1) : 0,
    };
  }

  async getCourses(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where: { isActive: true } }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getApplications(page: number = 1, limit: number = 10, status?: ApplicationStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentActivity() {
    const recentApplications = await this.prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      recentApplications: recentApplications.map(app => ({
        id: app.id,
        applicantName: app.name,
        courseName: app.course?.title || 'General Inquiry',
        status: app.status,
        createdAt: app.createdAt,
      })),
    };
  }
}