import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmployeeModule } from './employee.module';

async function bootstrap() {
  const port = Number(process.env.EMPLOYEE_SERVICE_PORT ?? 3001);
  const host = process.env.EMPLOYEE_SERVICE_HOST ?? '0.0.0.0';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmployeeModule,
    {
      transport: Transport.TCP,
      options: { host, port },
    },
  );

  await app.listen();
  Logger.log(`Employee microservice listening on ${host}:${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  Logger.error(message, 'Bootstrap');
  process.exit(1);
});
