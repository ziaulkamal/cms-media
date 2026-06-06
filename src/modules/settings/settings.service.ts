/**
 * src/modules/settings/settings.service.ts
 * Aturan bisnis Setting: baca publik (map), kelola dinamis, dan update massal.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

/** Nilai default layout footer (dipakai bila key belum ada). */
const DEFAULT_FOOTER_LAYOUT = {
  preset: 'balanced', // balanced | left-wide | right-wide | compact | custom
  gap: 'md', // sm | md | lg | xl
  identityWeight: 1.5, // bobot kolom identitas (logo + deskripsi)
  navWeight: 1, // bobot tiap kolom navigasi (dari menu footer)
  contactWeight: 1.3, // bobot kolom sekretariat/kontak
  showIdentity: true,
  showContact: true,
  gridTemplate: '', // override mentah (mode lanjutan); kosong = dihitung dari bobot
};

/**
 * Default "Tampilan Situs" (branding + footer) — dijamin ada saat boot agar
 * map publik selalu lengkap & bulkUpdate dari admin tak menolak key.
 * Nilai kosong = WEB pakai fallback bawaan (logo bundel / teks tersusun).
 */
const APPEARANCE_DEFAULTS: Prisma.SettingCreateInput[] = [
  // Branding
  { key: 'site_slogan', value: 'Bersatu, Berprestasi, Berjaya', type: SettingType.STRING, group: 'branding', label: 'Slogan', isPublic: true },
  { key: 'logo_main_light', value: '', type: SettingType.URL, group: 'branding', label: 'Logo Main — Light', isPublic: true },
  { key: 'logo_main_dark', value: '', type: SettingType.URL, group: 'branding', label: 'Logo Main — Dark', isPublic: true },
  { key: 'logo_footer_light', value: '', type: SettingType.URL, group: 'branding', label: 'Logo Footer — Light', isPublic: true },
  { key: 'logo_footer_dark', value: '', type: SettingType.URL, group: 'branding', label: 'Logo Footer — Dark', isPublic: true },
  { key: 'favicon', value: '', type: SettingType.URL, group: 'branding', label: 'Favicon', isPublic: true },
  { key: 'og_default_image', value: '', type: SettingType.URL, group: 'branding', label: 'Gambar Share Default (OG)', isPublic: true },
  // Footer
  { key: 'footer_description', value: '', type: SettingType.TEXT, group: 'footer', label: 'Deskripsi Footer', isPublic: true },
  { key: 'footer_secretariat_title', value: 'Sekretariat Panitia', type: SettingType.STRING, group: 'footer', label: 'Judul Kontak', isPublic: true },
  { key: 'contact_address', value: 'Kantor Bupati Aceh Jaya, Calang', type: SettingType.STRING, group: 'footer', label: 'Alamat', isPublic: true },
  { key: 'contact_phone', value: '(0654) 000-1234', type: SettingType.STRING, group: 'footer', label: 'Telepon', isPublic: true },
  { key: 'contact_email', value: 'info@pora-acehjaya.id', type: SettingType.STRING, group: 'footer', label: 'Email', isPublic: true },
  { key: 'footer_layout', value: DEFAULT_FOOTER_LAYOUT, type: SettingType.JSON, group: 'footer', label: 'Layout Kolom Footer', isPublic: true },
  { key: 'footer_social_placement', value: 'secretariat', type: SettingType.STRING, group: 'footer', label: 'Penempatan Ikon Sosial', isPublic: true },
  // Sosial media (daftar bebas: platform + url + aktif)
  {
    key: 'social_links',
    value: [
      { platform: 'facebook', url: 'https://facebook.com/poraacehjaya', enabled: true },
      { platform: 'instagram', url: 'https://instagram.com/poraacehjaya', enabled: true },
      { platform: 'x', url: 'https://x.com/poraacehjaya', enabled: true },
      { platform: 'youtube', url: '', enabled: false },
    ],
    type: SettingType.JSON,
    group: 'social',
    label: 'Daftar Sosial Media',
    isPublic: true,
  },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly repo: SettingsRepository,
    private readonly gateway: RealtimeGateway,
  ) {}

  /** Saat boot: buat setting "Tampilan Situs" yang belum ada (tanpa menimpa editan). */
  async onModuleInit(): Promise<void> {
    const existing = new Set((await this.repo.findAll()).map((s) => s.key));
    const missing = APPEARANCE_DEFAULTS.filter((d) => !existing.has(d.key));
    for (const d of missing) {
      await this.repo.upsert(d.key, d, {});
    }
    if (missing.length > 0) {
      this.logger.log(`Setting tampilan disiapkan: ${missing.map((m) => m.key).join(', ')}.`);
    }
  }

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
