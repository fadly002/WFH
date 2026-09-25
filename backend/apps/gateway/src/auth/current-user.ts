import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ActorContext } from '@app/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActorContext => {
    const request = ctx.switchToHttp().getRequest<{ user: ActorContext }>();
    return request.user;
  },
);
