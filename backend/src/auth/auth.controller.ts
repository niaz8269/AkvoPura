import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { AuthService, type AuthenticatedUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.identifier, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request): Promise<AuthenticatedUser> {
    const jwtUser = req.user as { sub: string };
    const user = await this.users.findById(jwtUser.sub);
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      identifier: user.identifier,
      name: user.name,
      role: user.role,
      branch: user.branch,
      linkedCgCustomerId: user.linkedCgCustomerId,
    };
  }
}
