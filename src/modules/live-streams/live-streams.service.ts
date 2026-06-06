/**
 * src/modules/live-streams/live-streams.service.ts
 * Aturan bisnis LiveStream: serving publik (+saklar), CRUD, dan toggle tayang.
 */
import { Injectable } from '@nestjs/common';
import { LiveStream } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { extractYoutubeId } from '../../common/utils/youtube';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';
import { UpdateLiveStreamDto } from './dto/update-live-stream.dto';
import {
  LiveStreamPublicView,
  LiveStreamView,
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
  constructor(private readonly repo: LiveStreamsRepository) {}

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
    const created = await this.repo.create({
      youtubeId,
      title: dto.title,
      sportName: dto.sportName,
      matchRef: dto.matchRef,
      venueName: dto.venueName,
      sortOrder: dto.sortOrder ?? 0,
      isLive: dto.isLive ?? false,
    });
    return toLiveStreamView(created);
  }

  /** Ubah kanal (youtube opsional; bila ada, dinormalkan ulang). */
  async update(id: string, dto: UpdateLiveStreamDto): Promise<LiveStreamView> {
    await this.getOrFail(id);
    const updated = await this.repo.update(id, {
      youtubeId: dto.youtube ? this.normalizeYoutube(dto.youtube) : undefined,
      title: dto.title,
      sportName: dto.sportName,
      matchRef: dto.matchRef,
      venueName: dto.venueName,
      sortOrder: dto.sortOrder,
      isLive: dto.isLive,
    });
    return toLiveStreamView(updated);
  }

  /** Toggle status tayang (isLive) kanal. */
  async toggle(id: string): Promise<LiveStreamView> {
    const current = await this.getOrFail(id);
    const updated = await this.repo.update(id, { isLive: !current.isLive });
    return toLiveStreamView(updated);
  }

  /** Hapus kanal. */
  async remove(id: string): Promise<{ id: string }> {
    await this.getOrFail(id);
    return this.repo.delete(id);
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
