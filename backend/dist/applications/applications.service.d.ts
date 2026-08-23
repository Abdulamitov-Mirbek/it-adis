import { PrismaService } from "../prisma/prisma.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationStatus } from "@prisma/client";
export declare class ApplicationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateApplicationDto): Promise<{
        success: boolean;
        id: string;
        message: string;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        course: {
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
    })[]>;
    updateStatus(id: string, status: ApplicationStatus): Promise<{
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
    }>;
}
