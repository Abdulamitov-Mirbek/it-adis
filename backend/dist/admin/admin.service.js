"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [totalCourses, totalApplications, pendingApplications, acceptedApplications, rejectedApplications,] = await Promise.all([
            this.prisma.course.count({ where: { isActive: true } }),
            this.prisma.application.count(),
            this.prisma.application.count({ where: { status: client_1.ApplicationStatus.PENDING } }),
            this.prisma.application.count({ where: { status: client_1.ApplicationStatus.ACCEPTED } }),
            this.prisma.application.count({ where: { status: client_1.ApplicationStatus.REJECTED } }),
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
    async getCourses(page = 1, limit = 10) {
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
    async getApplications(page = 1, limit = 10, status) {
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map