import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { requireJwtSecret } from '../config/secrets';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: any) {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });

    if (!adminUser) {
      throw new UnauthorizedException();
    }

    return { userId: payload.sub, email: payload.email };
  }
}