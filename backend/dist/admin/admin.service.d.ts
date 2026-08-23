import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        totalCourses: number;
        totalApplications: number;
        applicationsByStatus: {
            pending: number;
            accepted: number;
            rejected: number;
        };
        acceptanceRate: string | number;
    }>;
    getCourses(page?: number, limit?: number): Promise<{
        courses: ({
            _count: {
                applications: number;
            };
        } & {
            slug: string;
            title: string;
            description: string;
            longDesc: string | null;
            duration: string;
            level: import(".prisma/client").$Enums.CourseLevel;
            price: number;
            isFeatured: boolean;
            order: number;
            tags: string[];
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getApplications(page?: number, limit?: number, status?: ApplicationStatus): Promise<{
        applications: ({
            course: {
                slug: string;
                title: string;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            phone: string | null;
            program: string;
            message: string | null;
            status: import(".prisma/client").$Enums.ApplicationStatus;
            courseId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getRecentActivity(): Promise<{
        recentApplications: {
            id: string;
            applicantName: string;
            courseName: string;
            status: import(".prisma/client").$Enums.ApplicationStatus;
            createdAt: Date;
        }[];
    }>;
}
