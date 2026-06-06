/**
 * src/modules/live-streams/live-streams.service.ts
 * Aturan bisnis LiveStream: serving publik (+saklar), CRUD, dan toggle tayang.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LiveStream } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { extractYoutubeId } from '../../common/utils/youtube';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';
import { UpdateLiveStreamDto } from './dto/update-live-stream.dto';
import {
  LiveStreamPublicView,
  LiveStreamView,
  MatchOption,
  toLiveStreamPublicView,
  toLiveStreamView,
} from './entities/live-stream.entity';
import { LiveStreamsRepository } from './live-streams.repository';

/** Payload serving publik: saklar global + daftar kanal. */
export interface LiveStreamServing {
  streaming_enabled: boolean;
  channels: LiveStreamPublicView[];
}

/** Service LiveStream: orkestrasi kanal siaran langsung. */
@Injectable()
export class LiveStreamsService {
  private readonly simporaApiUrl: string;

  constructor(
    private readonly repo: LiveStreamsRepository,
    private readonly gateway: RealtimeGateway,
    config: ConfigService,
  ) {
    this.simporaApiUrl = config.get<string>('simporaApiUrl') ?? '';
  }

  /**
   * Daftar match (ongoing+scheduled) dari CORE utk dropdown penaut kanal admin.
   * Gagal/timeout → array kosong (UI tetap jalan, admin bisa input manual).
   */
  async fetchMatchOptions(): Promise<MatchOption[]> {
    if (!this.simporaApiUrl) return [];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(
        `${this.simporaApiUrl}/matches?status=scheduled,ongoing&per_page=200`,
        { signal: controller.signal, headers: { Accept: 'application/json' } },
      );
      if (!res.ok) return [];
      return this.toMatchOptions(await res.json());
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Petakan respons CORE (paginator) → opsi dropdown; toleran bentuk pembungkus. */
  private toMatchOptions(body: unknown): MatchOption[] {
    const data = (body as { data?: unknown })?.data;
    const rows: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray((data as { data?: unknown })?.data)
        ? (data as { data: unknown[] }).data
        : [];
    return rows.map((row) => {
      const m = row as Record<string, unknown>;
      const sc = m.sportCategory as Record<string, unknown> | undefined;
      const sport =
        ((sc?.sport as Record<string, unknown> | undefined)?.name as string) ??
        (sc?.name as string) ??
        null;
      const venue =
        ((m.venue as Record<string, unknown> | undefined)?.name as string) ??
        null;
      const code = String(m.match_code ?? m.id ?? '');
      const round = (m.round as string) ?? (sc?.name as string) ?? '';
      return {
        ref: String(m.id ?? ''),
        code,
        sportName: sport,
        venueName: venue,
        status: String(m.status ?? ''),
        label: [code, sport, round].filter(Boolean).join(' · '),
      };
    });
  }

  /** Serving publik: master saklar (dari Setting) + daftar kanal. */
  async serve(): Promise<LiveStreamServing> {
    const [enabled, channels] = await Promise.all([
      this.repo.streamingEnabled(),
      this.repo.findAll(),
    ]);
    return {
      streaming_enabled: enabled,
      channels: channels.map(toLiveStreamPublicView),
    };
  }

  /** Daftar kanal untuk admin (field lengkap). */
  async listManage(): Promise<LiveStreamView[]> {
    return (await this.repo.findAll()).map(toLiveStreamView);
  }

  /** Buat kanal; normalkan input YouTube menjadi video id. */
  async create(dto: CreateLiveStreamDto): Promise<LiveStreamView> {
    const youtubeId = this.normalizeYoutube(dto.youtube);
    if (dto.isFeatured) await this.assertFeaturedLimit();
    const created = await this.repo.create({
      youtubeId,
      title: dto.title,
      sportName: dto.sportName,
      matchRef: dto.matchRef,
      venueName: dto.venueName,
      sortOrder: dto.sortOrder ?? 0,
      isLive: dto.isLive ?? false,
      isFeatured: dto.isFeatured ?? false,
    });
    this.gateway.emitStreamUpdated();
    return toLiveStreamView(created);
  }

  /** Ubah kanal (youtube opsional; bila ada, dinormalkan ulang). */
  async update(id: string, dto: UpdateLiveStreamDto): Promise<LiveStreamView> {
    const current = await this.getOrFail(id);
    if (dto.isFeatured && !current.isFeatured) await this.assertFeaturedLimit(id);
    const updated = await this.repo.update(id, {
      youtubeId: dto.youtube ? this.normalizeYoutube(dto.youtube) : undefined,
      title: dto.title,
      sportName: dto.sportName,
      matchRef: dto.matchRef,
      venueName: dto.venueName,
      sortOrder: dto.sortOrder,
      isLive: dto.isLive,
      isFeatured: dto.isFeatured,
    });
    this.gateway.emitStreamUpdated();
    return toLiveStreamView(updated);
  }

  /** Toggle status tayang (isLive) kanal. */
  async toggle(id: string): Promise<LiveStreamView> {
    const current = await this.getOrFail(id);
    const updated = await this.repo.update(id, { isLive: !current.isLive });
    this.gateway.emitStreamUpdated();
    return toLiveStreamView(updated);
  }

  /** Toggle sorotan; saat mengaktifkan, batasi maksimum 2 sorotan. */
  async toggleFeatured(id: string): Promise<LiveStreamView> {
    const current = await this.getOrFail(id);
    if (!current.isFeatured) await this.assertFeaturedLimit(id);
    const updated = await this.repo.update(id, { isFeatured: !current.isFeatured });
    this.gateway.emitStreamUpdated();
    return toLiveStreamView(updated);
  }

  /** Lempar bila sudah ada 2 sorotan aktif (di luar id yang dikecualikan). */
  private async assertFeaturedLimit(excludeId?: string): Promise<void> {
    if ((await this.repo.countFeatured(excludeId)) >= 2) {
      throw new ValidationError('Maksimum 2 sorotan. Nonaktifkan salah satu dulu.');
    }
  }

  /** Hapus kanal. */
  async remove(id: string): Promise<{ id: string }> {
    await this.getOrFail(id);
    const result = await this.repo.delete(id);
    this.gateway.emitStreamUpdated();
    return result;
  }

  /** Validasi & ubah URL/id YouTube menjadi video id; lempar bila tak valid. */
  private normalizeYoutube(input: string): string {
    const id = extractYoutubeId(input);
    if (!id) throw new ValidationError('URL/ID YouTube tidak valid.');
    return id;
  }

  private async getOrFail(id: string): Promise<LiveStream> {
    const stream = await this.repo.findById(id);
    if (!stream) throw new NotFoundError('Kanal siaran tidak ditemukan.');
    return stream;
  }
}
