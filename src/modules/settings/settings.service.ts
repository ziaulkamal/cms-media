/**
 * src/modules/settings/settings.service.ts
 * Aturan bisnis Setting: baca publik (map), kelola dinamis, dan update massal.
 */
import { Injectable } from '@nestjs/common';
import { Prisma, Setting, SettingType } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SettingsRepository } from './settings.repository';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import {
  SettingView,
  toSettingView,
  toValueMap,
} from './entities/setting.entity';

/** Format key yang diizinkan: huruf kecil, angka, underscore. */
const KEY_PATTERN = /^[a-z0-9_]+$/;

/** Service Setting: konfigurasi situs dinamis (key-value). */
/** Key master saklar siaran; perubahannya disiarkan via gateway realtime. */
const STREAMING_KEY = 'streaming_enabled';

@Injectable()
export class SettingsService {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly gateway: RealtimeGateway,
  ) {}

  /** Map { key: value } untuk setting publik (SEO/meta) — dikonsumsi frontend. */
  async getPublicMap(): Promise<Record<string, unknown>> {
    return toValueMap(await this.repo.findPublic());
  }

  /** Daftar lengkap setting (admin). */
  async list(): Promise<SettingView[]> {
    return (await this.repo.findAll()).map(toSettingView);
  }

  /** Ambil satu setting via key. */
  async getByKey(key: string): Promise<SettingView> {
    return toSettingView(await this.getOrFail(key));
  }

  /** Buat atau perbarui setting (mendukung penambahan key baru dinamis). */
  async upsert(key: string, dto: UpsertSettingDto): Promise<SettingView> {
    if (!KEY_PATTERN.test(key)) {
      throw new ValidationError('key hanya boleh huruf kecil, angka, underscore.');
    }
    const value =
      dto.value === undefined
        ? undefined
        : (dto.value as Prisma.InputJsonValue);

    const setting = await this.repo.upsert(
      key,
      {
        key,
        value,
        type: dto.type ?? SettingType.STRING,
        group: dto.group ?? 'general',
        label: dto.label,
        isPublic: dto.isPublic ?? false,
      },
      {
        value,
        type: dto.type,
        group: dto.group,
        label: dto.label,
        isPublic: dto.isPublic,
      },
    );
    if (key === STREAMING_KEY) {
      this.gateway.emitStreamingToggled(dto.value === true);
    }
    return toSettingView(setting);
  }

  /** Update nilai banyak setting sekaligus; semua key wajib sudah ada. */
  async bulkUpdate(values: Record<string, unknown>): Promise<{ updated: number }> {
    const keys = Object.keys(values);
    if (keys.length === 0) {
      throw new ValidationError('Tidak ada nilai untuk diperbarui.');
    }
    const existing = await this.repo.findAll();
    const existingKeys = new Set(existing.map((s) => s.key));
    const missing = keys.filter((k) => !existingKeys.has(k));
    if (missing.length > 0) {
      throw new ValidationError(`Key tidak dikenal: ${missing.join(', ')}.`);
    }

    await this.repo.updateValues(
      keys.map((key) => ({ key, value: values[key] as Prisma.InputJsonValue })),
    );
    if (STREAMING_KEY in values) {
      this.gateway.emitStreamingToggled(values[STREAMING_KEY] === true);
    }
    return { updated: keys.length };
  }

  /** Hapus setting (key dinamis). */
  async remove(key: string): Promise<{ key: string }> {
    await this.getOrFail(key);
    await this.repo.delete(key);
    return { key };
  }

  private async getOrFail(key: string): Promise<Setting> {
    const setting = await this.repo.findByKey(key);
    if (!setting) throw new NotFoundError('Setting tidak ditemukan.');
    return setting;
  }
}
