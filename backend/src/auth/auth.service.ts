import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService, unwrap } from '../supabase/supabase.service';
import { AdminUser, TABLES } from '../supabase/types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private db: SupabaseService,
    private jwtService: JwtService,
  ) {}

  /**
   * A bcrypt hash of a value nobody can supply, compared against when the email
   * is unknown.
   *
   * Without it the lookup short-circuits: an unknown email returns in the time
   * of one database query, a known one costs a full bcrypt comparison on top.
   * That difference is measurable over the network and tells an attacker which
   * addresses are real admins — the first half of the credentials they need.
   * Every login now pays the same bcrypt cost.
   */
  private static readonly DUMMY_HASH = bcrypt.hashSync(
    "no-such-account-placeholder",
    10,
  );

  async validateAdmin(email: string, password: string): Promise<any> {
    const adminUser = unwrap<AdminUser | null>(
      await this.db
        .from(TABLES.adminUsers)
        .select('*')
        .eq('email', email)
        .maybeSingle(),
      'auth.validateAdmin',
    );

    const hash = adminUser?.passwordHash ?? AuthService.DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(password, hash);

    if (adminUser && passwordMatches) {
      const { passwordHash: _, ...result } = adminUser;
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const admin = await this.validateAdmin(email, password);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
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

  async getProfile(userId: string) {
    const adminUser = unwrap<Pick<
      AdminUser,
      'id' | 'email' | 'name' | 'createdAt'
    > | null>(
      await this.db
        .from(TABLES.adminUsers)
        .select('id, email, name, createdAt')
        .eq('id', userId)
        .maybeSingle(),
      'auth.getProfile',
    );

    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    return adminUser;
  }
}
