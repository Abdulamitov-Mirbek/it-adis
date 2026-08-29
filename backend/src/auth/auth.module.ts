import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JWT_EXPIRES_IN, requireJwtSecret } from '../config/secrets';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      // Async so the secret is read (and validated) at module init rather
      // than at import time, which is what let a bad value reach runtime.
      useFactory: () => ({
        secret: requireJwtSecret(),
        // @types/jsonwebtoken narrows expiresIn to a template-literal union
        // ('8h', '30m', ...) that an env-supplied string cannot satisfy at
        // compile time. The value is validated as a duration at runtime.
        signOptions: {
          expiresIn: JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}