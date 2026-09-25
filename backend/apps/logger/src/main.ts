import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LoggerModule } from './logger.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(LoggerModule);
  app.enableShutdownHooks();
  Logger.log('Logger worker consuming audit queue → dexa_audit', 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  Logger.error(message, 'Bootstrap');
  process.exit(1);
});
