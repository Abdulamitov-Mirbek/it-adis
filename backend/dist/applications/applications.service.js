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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ApplicationsService = class ApplicationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const application = await this.prisma.application.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                program: dto.program,
                message: dto.message,
                status: client_1.ApplicationStatus.PENDING,
            },
        });
        console.log(`📬 New application from ${application.name} <${application.email}> for "${application.program}"`);
        return {
            success: true,
            id: application.id,
            message: "Application received. We will contact you within 24 hours.",
        };
    }
    findAll() {
        return this.prisma.application.findMany({
            orderBy: { createdAt: "desc" },
            include: { course: true },
        });
    }
    async updateStatus(id, status) {
        return this.prisma.application.update({
            where: { id },
            data: { status },
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map