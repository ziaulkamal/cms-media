/**
 * src/modules/settings/settings.repository.ts
 * Akses data Setting (key-value konfigurasi situs) terpusat di repository.
 */
import { Injectable } from '@nestjs/common';
import { Prisma, Setting } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository Setting: pembungkus query Prisma untuk konfigurasi dinamis. */
@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKey(key: string): Promise<Setting | null> {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  findAll(): Promise<Setting[]> {
    return this.prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  findPublic(): Promise<Setting[]> {
    return this.prisma.setting.findMany({ where: { isPublic: true } });
  }

  /** Buat atau perbarui setting berdasarkan key (idempoten). */
  upsert(
    key: string,
    create: Prisma.SettingCreateInput,
    update: Prisma.SettingUpdateInput,
  ): Promise<Setting> {
    return this.prisma.setting.upsert({ where: { key }, create, update });
  }

  /** Perbarui nilai banyak setting dalam satu transaksi. */
  updateValues(entries: { key: string; value: Prisma.InputJsonValue }[]): Promise<unknown> {
    return this.prisma.$transaction(
      entries.map((e) =>
        this.prisma.setting.update({
          where: { key: e.key },
          data: { value: e.value },
        }),
      ),
    );
  }

  delete(key: string): Promise<Setting> {
    return this.prisma.setting.delete({ where: { key } });
  }
}
