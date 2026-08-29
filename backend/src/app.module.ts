import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { CoursesModule } from "./courses/courses.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { PublicModule } from "./public/public.module";
import { ContentModule } from "./content/content.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Nothing was rate limited before, so POST /auth/login accepted unlimited
    // password guesses and POST /applications accepted unlimited rows. Two
    // buckets: "burst" absorbs a rapid flood, "sustained" stops a patient
    // attacker from simply pacing their requests under the burst limit.
    //
    // Per-route overrides must name BOTH buckets (see THROTTLE_LOGIN and
    // friends in throttle.ts). A @Throttle that names only one leaves the other
    // in force at its global value, which silently defeats the tighter limit.
    ThrottlerModule.forRoot([
      { name: "burst", ttl: 1_000, limit: 10 },
      { name: "sustained", ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    CoursesModule,
    ApplicationsModule,
    AuthModule,
    AdminModule,
    PublicModule,
    ContentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
