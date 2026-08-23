import { CourseLevel } from "@prisma/client";
export declare class CreateCourseDto {
    slug: string;
    title: string;
    description: string;
    longDesc?: string;
    duration: string;
    level: CourseLevel;
    price: number;
    isFeatured?: boolean;
    order?: number;
    tags: string[];
}
