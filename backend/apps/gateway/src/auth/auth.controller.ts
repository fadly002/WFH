import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_PATTERNS, EMPLOYEE_PATTERNS, SERVICES, type ActorContext } from '@app/common';
import { CurrentUser } from './current-user';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto';
import { ProxyService } from '../proxy/proxy.service';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(SERVICES.EMPLOYEE) private readonly employeeClient: ClientProxy,
    private readonly jwt: JwtService,
    private readonly proxy: ProxyService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.proxy.send<{
      userId: string;
      email: string;
      role: 'ADMIN' | 'EMPLOYEE';
      name: string;
    }>(this.employeeClient, AUTH_PATTERNS.LOGIN, body);

    const accessToken = await this.jwt.signAsync({
      sub: user.userId,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() actor: ActorContext) {
    if (actor.role === 'ADMIN') {
      return {
        userId: actor.userId,
        email: actor.email,
        role: actor.role,
        name: 'HRD Admin',
      };
    }

    const profile = await this.proxy.send<{ name: string }>(
      this.employeeClient,
      EMPLOYEE_PATTERNS.GET_ME,
      actor,
    );

    return {
      userId: actor.userId,
      email: actor.email,
      role: actor.role,
      name: profile.name,
    };
  }
}
