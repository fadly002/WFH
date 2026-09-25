import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@app/common';
import { AuditPrismaService } from './audit-prisma.service';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), QueueModule],
  providers: [AuditPrismaService, AuditConsumer],
})
export class LoggerModule {}
