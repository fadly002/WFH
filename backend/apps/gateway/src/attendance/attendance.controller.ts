import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IsIn, IsOptional, Matches } from 'class-validator';
import {
  ATTENDANCE_PATTERNS,
  SERVICES,
  type ActorContext,
} from '@app/common';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProxyService } from '../proxy/proxy.service';

class ClockDto {
  @IsIn(['MASUK', 'PULANG'])
  type!: 'MASUK' | 'PULANG';
}

class SummaryQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE')
export class AttendanceController {
  constructor(
    @Inject(SERVICES.ATTENDANCE) private readonly attendanceClient: ClientProxy,
    private readonly proxy: ProxyService,
  ) {}

  @Post('clock')
  clock(@CurrentUser() actor: ActorContext, @Body() body: ClockDto) {
    return this.proxy.send(this.attendanceClient, ATTENDANCE_PATTERNS.CLOCK, {
      actor,
      type: body.type,
    });
  }

  @Get('summary')
  summary(@CurrentUser() actor: ActorContext, @Query() query: SummaryQueryDto) {
    const now = new Date();
    const from =
      query.from ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const to = query.to ?? now.toISOString().slice(0, 10);

    return this.proxy.send(this.attendanceClient, ATTENDANCE_PATTERNS.SUMMARY, {
      actor,
      from,
      to,
    });
  }
}
