import { PrismaService } from '../prisma/prisma.service';
export declare class PublicService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        students: number;
        employed: number;
        courses: number;
        years: number;
    }>;
    getReviews(): Promise<{
        id: number;
        name: string;
        role: string;
        initials: string;
        color: string;
        stars: number;
        text: string;
        course: string;
    }[]>;
    getTeachers(): Promise<{
        id: number;
        name: string;
        role: string;
        bio: string;
        tags: string[];
        initials: string;
        color: string;
    }[]>;
}
