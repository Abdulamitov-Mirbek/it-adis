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
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
function sha256(s) {
    return crypto.createHash("sha256").update(s).digest("hex");
}
let AdminGuard = class AdminGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const authHeader = req.headers["authorization"] ?? "";
        const secretHeader = req.headers["x-admin-secret"];
        let secret = null;
        if (authHeader.startsWith("Bearer ")) {
            secret = authHeader.slice(7);
        }
        else if (secretHeader) {
            secret = secretHeader;
        }
        if (!secret)
            throw new common_1.UnauthorizedException("Admin credentials required");
        const envSecret = process.env.ADMIN_SECRET ?? "itadis_admin_2026";
        if (secret === envSecret)
            return true;
        const admin = await this.prisma.adminUser.findFirst({
            where: { passwordHash: sha256(secret) },
        });
        if (admin)
            return true;
        throw new common_1.UnauthorizedException("Invalid admin credentials");
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map