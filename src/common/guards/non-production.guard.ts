/**
 * src/common/guards/non-production.guard.ts
 * Izinkan akses hanya di lingkungan non-produksi (mis. tools dummy seeder).
 */
import { CanActivate, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForbiddenError } from '../errors/domain-error';

/** Tolak request bila NODE_ENV === 'production'. */
@Injectable()
export class NonProductionGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>('env') === 'production') {
      throw new ForbiddenError('Fitur ini tidak tersedia di produksi.');
    }
    return true;
  }
}
