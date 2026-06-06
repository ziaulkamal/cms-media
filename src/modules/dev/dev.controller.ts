/**
 * src/modules/dev/dev.controller.ts
 * Endpoint generator dummy (ADMIN + non-produksi): generate, bersihkan, statistik.
 */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { NonProductionGuard } from '../../common/guards/non-production.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { DevService } from './dev.service';
import { GenerateDummyDto } from './dto/generate-dummy.dto';

/** Route tools developer; ADMIN saja & dinonaktifkan di produksi. */
@ApiTags('Dev')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(NonProductionGuard)
@Controller('dev')
export class DevController {
  constructor(private readonly dev: DevService) {}

  /** Statistik data dummy yang ada saat ini. */
  @Get('dummy-stats')
  stats() {
    return this.dev.stats();
  }

  /** Generate data dummy sesuai pilihan. */
  @Post('seed-dummy')
  generate(
    @Body() dto: GenerateDummyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dev.generate(dto, user.id);
  }

  /** Hapus seluruh data dummy (termasuk berkas galeri). */
  @Post('clear-dummy')
  clear() {
    return this.dev.clear();
  }
}
