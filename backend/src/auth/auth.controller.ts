import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { AuthService, type AuthenticatedUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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

  /** Public customer self-registration. Returns no token. */
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register({
      identifier: body.identifier,
      name: body.name,
      password: body.password,
      phone: body.phone,
      branchSlug: body.branchSlug,
      customerKind: body.customerKind,
      address: body.address,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request): Promise<AuthenticatedUser> {
    const jwtUser = req.user as { sub: string };
    const user = await this.users.findById(jwtUser.sub);
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.active) {
      // Token still valid but account was deactivated — caller should logout.
      throw new UnauthorizedException('Account deactivated');
    }
    return {
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
  }
}
