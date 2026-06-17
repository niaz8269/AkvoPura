import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService, type RegisterCustomerParams } from '../users/users.service';

export type AuthenticatedUser = {
  id: string;
  identifier: string;
  name: string;
  role: string;
  branch: string | null;
  active: boolean;
  verified: boolean;
  linkedCgCustomerId: string | null;
  linkedPetCustomerId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(identifier: string, password: string) {
    const user = await this.users.findByIdentifier(identifier);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.active) throw new UnauthorizedException('Account deactivated');
    if (!user.verified) {
      throw new ForbiddenException(
        'Your registration is awaiting branch manager approval. Try again later.',
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const safeUser: AuthenticatedUser = {
      id: user.id,
      identifier: user.identifier,
      name: user.name,
      role: user.role,
      branch: user.branchSlug,
      active: user.active,
      verified: user.verified,
      linkedCgCustomerId: user.linkedCgCustomerId,
      linkedPetCustomerId: user.linkedPetCustomerId,
    };

    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      branch: user.branchSlug,
    });

    return { token, user: safeUser };
  }

  /**
   * Public customer self-registration. Creates a pending user — does NOT
   * issue a token. The customer must wait for branch manager approval
   * before they can log in.
   */
  async register(params: RegisterCustomerParams) {
    const created = await this.users.registerCustomer(params);
    return {
      ok: true,
      message:
        'Account created. Your branch manager will verify it shortly. You will be able to log in once approved.',
      userId: created.id,
    };
  }

  /**
   * Self-service password change for the currently logged-in user.
   * Requires the user to type their current password — protects against a
   * stolen-phone scenario where someone could change the password without
   * knowing the old one.
   */
  async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is wrong');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  }
}
