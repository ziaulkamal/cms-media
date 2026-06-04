/**
 * src/common/decorators/current-user.decorator.ts
 * Mengambil AuthenticatedUser dari request untuk dipakai di handler controller.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../types/authenticated-user';

/** Inject pengguna terautentikasi (hasil JwtAuthGuard) ke parameter handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
