import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from '@app/common';
import { AuthController } from './auth/auth.controller';
import { EmployeesController } from './employees/employees.controller';
import { AttendanceController } from './attendance/attendance.controller';
import { AdminEmployeesController } from './admin/admin-employees.controller';
import { AdminAttendanceController } from './admin/admin-attendance.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { NotificationGateway } from './realtime/notification.gateway';
import { ProxyService } from './proxy/proxy.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me'),
        signOptions: { expiresIn: 60 * 60 * 12 },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: SERVICES.EMPLOYEE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('EMPLOYEE_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get('EMPLOYEE_SERVICE_PORT', 3001)),
          },
        }),
      },
      {
        name: SERVICES.ATTENDANCE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('ATTENDANCE_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get('ATTENDANCE_SERVICE_PORT', 3002)),
          },
        }),
      },
    ]),
  ],
  controllers: [
    AuthController,
    EmployeesController,
    AttendanceController,
    AdminEmployeesController,
    AdminAttendanceController,
    HealthController,
  ],
  providers: [JwtAuthGuard, RolesGuard, NotificationGateway, ProxyService],
})
export class GatewayModule {}
