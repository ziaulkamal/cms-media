/**
 * src/common/guards/ws-aware-throttler.guard.ts
 * ThrottlerGuard yang melewati konteks non-HTTP (mis. pesan WebSocket).
 */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Rate-limit hanya untuk HTTP; gateway WebSocket tidak di-throttle di sini. */
@Injectable()
export class WsAwareThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    return super.canActivate(context);
  }
}
