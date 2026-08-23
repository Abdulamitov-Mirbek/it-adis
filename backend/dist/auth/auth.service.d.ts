import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateAdmin(email: string, password: string): Promise<any>;
    login(email: string, password: string): Promise<{
        access_token: string;
        admin: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    getProfile(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        email: string;
    }>;
}
