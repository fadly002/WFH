import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class ProxyService {
  async send<TResult, TInput = unknown>(
    client: ClientProxy,
    pattern: string,
    data: TInput,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        client.send<TResult, TInput>(pattern, data).pipe(timeout(8000)),
      );
    } catch (error: unknown) {
      throw this.toHttp(error);
    }
  }

  private toHttp(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const rpc = this.asRpc(error);
    if (rpc) {
      return new HttpException(rpc.message, rpc.status);
    }

    const message =
      error instanceof Error ? error.message : 'Layanan tidak tersedia saat ini';
    return new HttpException(message, HttpStatus.BAD_GATEWAY);
  }

  private asRpc(error: unknown): { status: number; message: string } | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const candidate = error as { status?: unknown; message?: unknown; error?: unknown };
    const nested =
      candidate.error && typeof candidate.error === 'object'
        ? (candidate.error as { status?: unknown; message?: unknown })
        : candidate;

    const status = typeof nested.status === 'number' ? nested.status : null;
    const message = typeof nested.message === 'string' ? nested.message : null;

    if (status && message) {
      return { status, message };
    }

    return null;
  }
}
