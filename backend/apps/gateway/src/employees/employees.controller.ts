import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import {
  EMPLOYEE_PATTERNS,
  SERVICES,
  type ActorContext,
} from '@app/common';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProxyService } from '../proxy/proxy.service';
import { NotificationGateway } from '../realtime/notification.gateway';
import { imageUploadOptions, toPublicUploadUrl } from '../upload/upload';

class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{8,20}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(
    @Inject(SERVICES.EMPLOYEE) private readonly employeeClient: ClientProxy,
    private readonly proxy: ProxyService,
    private readonly notifications: NotificationGateway,
  ) {}

  @Get('me')
  @Roles('EMPLOYEE')
  getMe(@CurrentUser() actor: ActorContext) {
    return this.proxy.send(this.employeeClient, EMPLOYEE_PATTERNS.GET_ME, actor);
  }

  @Patch('me')
  @Roles('EMPLOYEE')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions()))
  async updateMe(
    @CurrentUser() actor: ActorContext,
    @Body() body: UpdateMyProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.proxy.send<{
      profile: unknown;
      notification: {
        title: string;
        message: string;
        employeeId: string;
        employeeName: string;
        changes: Record<string, unknown>;
        at: string;
      };
    }>(this.employeeClient, EMPLOYEE_PATTERNS.UPDATE_ME, {
      actor,
      phone: body.phone,
      password: body.password,
      photoUrl: file ? toPublicUploadUrl(file.filename) : undefined,
    });

    this.notifications.notifyAdmins(result.notification);
    return result.profile;
  }
}
