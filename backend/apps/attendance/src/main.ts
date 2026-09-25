import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AttendanceModule } from './attendance.module';

async function bootstrap() {
  const port = Number(process.env.ATTENDANCE_SERVICE_PORT ?? 3002);
  const host = process.env.ATTENDANCE_SERVICE_HOST ?? '0.0.0.0';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AttendanceModule,
    {
      transport: Transport.TCP,
      options: { host, port },
    },
  );

  await app.listen();
  Logger.log(`Attendance microservice listening on ${host}:${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  Logger.error(message, 'Bootstrap');
  process.exit(1);
});
