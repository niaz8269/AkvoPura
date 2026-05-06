import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';

export type AuthenticatedUser = {
  id: string;
  identifier: string;
  name: string;
  role: string;
  branch: string | null;
  linkedCgCustomerId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    const user = await this.users.findByIdentifier(identifier);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const safeUser: AuthenticatedUser = {
      id: user.id,
      identifier: user.identifier,
      name: user.name,
      role: user.role,
      branch: user.branch,
      linkedCgCustomerId: user.linkedCgCustomerId,
    };

    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      branch: user.branch,
    });

    return { token, user: safeUser };
  }
}
