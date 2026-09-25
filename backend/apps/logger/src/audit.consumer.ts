import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QUEUE_NAMES, QueueService, type AuditJobPayload } from '@app/common';
import { AuditPrismaService } from './audit-prisma.service';

@Injectable()
export class AuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(
    private readonly queue: QueueService,
    private readonly auditPrisma: AuditPrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.getClient().work(QUEUE_NAMES.AUDIT_LOG, async (jobs) => {
      for (const job of jobs) {
        await this.persist(job.data);
      }
    });
    this.logger.log(`Listening to queue ${QUEUE_NAMES.AUDIT_LOG}`);
  }

  private async persist(data: AuditJobPayload): Promise<void> {
    await this.auditPrisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        actorId: data.actorId,
        actorEmail: data.actorEmail,
        payload: data.payload as object,
      },
    });
    this.logger.log(`Audit stored: ${data.action} ${data.entityId}`);
  }
}
