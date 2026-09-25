import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IsOptional, IsUUID, Matches } from 'class-validator';
import { ATTENDANCE_PATTERNS, SERVICES, type ActorContext } from '@app/common';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProxyService } from '../proxy/proxy.service';

class AdminAttendanceQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

@Controller('admin/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAttendanceController {
  constructor(
    @Inject(SERVICES.ATTENDANCE) private readonly attendanceClient: ClientProxy,
    private readonly proxy: ProxyService,
  ) {}

  @Get()
  list(@CurrentUser() actor: ActorContext, @Query() query: AdminAttendanceQueryDto) {
    return this.proxy.send(this.attendanceClient, ATTENDANCE_PATTERNS.LIST_ALL, {
      actor,
      from: query.from,
      to: query.to,
      employeeId: query.employeeId,
    });
  }
}
