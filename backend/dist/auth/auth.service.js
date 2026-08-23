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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateAdmin(email, password) {
        const adminUser = await this.prisma.adminUser.findUnique({
            where: { email },
        });
        if (adminUser && await bcrypt.compare(password, adminUser.passwordHash)) {
            const { passwordHash: _, ...result } = adminUser;
            return result;
        }
        return null;
    }
    async login(email, password) {
        const admin = await this.validateAdmin(email, password);
        if (!admin) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { email: admin.email, sub: admin.id };
        return {
            access_token: this.jwtService.sign(payload),
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        };
    }
    async getProfile(userId) {
        const adminUser = await this.prisma.adminUser.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        if (!adminUser) {
            throw new common_1.UnauthorizedException('Admin user not found');
        }
        return adminUser;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map