import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { EMPLOYEE_PATTERNS, SERVICES, type ActorContext } from '@app/common';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProxyService } from '../proxy/proxy.service';
import { imageUploadOptions, toPublicUploadUrl } from '../upload/upload';

class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  position!: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{8,20}$/)
  phone!: string;
}

class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{8,20}$/)
  phone?: string;
}

@Controller('admin/employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEmployeesController {
  constructor(
    @Inject(SERVICES.EMPLOYEE) private readonly employeeClient: ClientProxy,
    private readonly proxy: ProxyService,
  ) {}

  @Get()
  list() {
    return this.proxy.send(this.employeeClient, EMPLOYEE_PATTERNS.LIST, {});
  }

  @Get(':id')
  get(@Param('id') employeeId: string) {
    return this.proxy.send(this.employeeClient, EMPLOYEE_PATTERNS.GET, { employeeId });
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions()))
  create(
    @CurrentUser() actor: ActorContext,
    @Body() body: CreateEmployeeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.proxy.send(this.employeeClient, EMPLOYEE_PATTERNS.CREATE, {
      actor,
      ...body,
      photoUrl: file ? toPublicUploadUrl(file.filename) : undefined,
    });
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions()))
  update(
    @CurrentUser() actor: ActorContext,
    @Param('id') employeeId: string,
    @Body() body: UpdateEmployeeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.proxy.send(this.employeeClient, EMPLOYEE_PATTERNS.UPDATE, {
      actor,
      employeeId,
      ...body,
      photoUrl: file ? toPublicUploadUrl(file.filename) : undefined,
    });
  }
}
