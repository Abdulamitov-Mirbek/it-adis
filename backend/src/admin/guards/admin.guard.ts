import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();

    // Support Bearer token OR x-admin-secret header
    const authHeader = req.headers["authorization"] ?? "";
    const secretHeader = req.headers["x-admin-secret"] as string | undefined;

    let secret: string | null = null;

    if (authHeader.startsWith("Bearer ")) {
      secret = authHeader.slice(7);
    } else if (secretHeader) {
      secret = secretHeader;
    }

    if (!secret) throw new UnauthorizedException("Admin credentials required");

    // Check against env secret (simple header auth for admin panel)
    const envSecret = process.env.ADMIN_SECRET ?? "itadis_admin_2026";
    if (secret === envSecret) return true;

    // Or check hashed password in DB
    const admin = await this.prisma.adminUser.findFirst({
      where: { passwordHash: sha256(secret) },
    });
    if (admin) return true;

    throw new UnauthorizedException("Invalid admin credentials");
  }
}
