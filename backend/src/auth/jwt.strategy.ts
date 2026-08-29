import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService, unwrap } from '../supabase/supabase.service';
import { TABLES } from '../supabase/types';
import { requireJwtSecret } from '../config/secrets';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private db: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: any) {
    // Re-checked on every request rather than trusted from the token: a deleted
    // admin's outstanding token stops working immediately.
    const adminUser = unwrap<{ id: string } | null>(
      await this.db
        .from(TABLES.adminUsers)
        .select('id')
        .eq('id', payload.sub)
        .maybeSingle(),
      'auth.jwtValidate',
    );

    if (!adminUser) {
      throw new UnauthorizedException();
    }

    return { userId: payload.sub, email: payload.email };
  }
}
