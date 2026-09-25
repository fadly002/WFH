import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QUEUE_NAMES } from '../patterns';
import type { AuditJobPayload } from '../dto';

type AuditJob = { data: AuditJobPayload };

type BossClient = {
  start: () => Promise<unknown>;
  stop: (options?: { graceful?: boolean; timeout?: number }) => Promise<void>;
  on: (event: 'error', handler: (error: Error) => void) => void;
  createQueue: (name: string) => Promise<void>;
  send: (name: string, data: object) => Promise<string | null>;
  work: (
    name: string,
    handler: (jobs: AuditJob[]) => Promise<void>,
  ) => Promise<string>;
};

type BossConstructor = new (options: {
  connectionString: string;
  retryLimit?: number;
  retryBackoff?: boolean;
}) => BossClient;

// pg-boss v10 is CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PgBoss = require('pg-boss') as BossConstructor;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private boss: BossClient | null = null;

  async onModuleInit(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for the message queue');
    }

    this.boss = new PgBoss({
      connectionString,
      retryLimit: 5,
      retryBackoff: true,
    });

    this.boss.on('error', (error: Error) => {
      this.logger.error(error.message);
    });

    await this.boss.start();
    await this.boss.createQueue(QUEUE_NAMES.AUDIT_LOG);
    this.logger.log('pg-boss queue started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss?.stop({ graceful: true, timeout: 5000 });
  }

  getClient(): BossClient {
    if (!this.boss) {
      throw new Error('Queue is not initialized');
    }
    return this.boss;
  }

  async publishAudit(payload: AuditJobPayload): Promise<string | null> {
    const jobId = await this.getClient().send(QUEUE_NAMES.AUDIT_LOG, payload);
    this.logger.log(`Queued audit job ${jobId ?? 'n/a'} (${payload.action})`);
    return jobId;
  }
}
