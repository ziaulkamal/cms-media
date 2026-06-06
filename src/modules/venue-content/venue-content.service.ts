/**
 * src/modules/venue-content/venue-content.service.ts
 * Aturan bisnis VenueContent: pengayaan venue + proxy daftar venue simpora2026.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../common/errors/domain-error';
import { UpsertVenueContentDto } from './dto/upsert-venue-content.dto';
import {
  toVenueContentView,
  VenueContentView,
} from './entities/venue-content.entity';
import { VenueContentRepository } from './venue-content.repository';

/** Hasil proxy daftar venue dari simpora2026 (read-only untuk dropdown admin). */
export interface VenueSources {
  available: boolean;
  venues: unknown[];
}

/** Service VenueContent: kelola konten + ambil daftar venue upstream. */
@Injectable()
export class VenueContentService {
  private readonly logger = new Logger(VenueContentService.name);
  private readonly simporaApiUrl: string;

  constructor(
    private readonly repo: VenueContentRepository,
    config: ConfigService,
  ) {
    this.simporaApiUrl = config.get<string>('simporaApiUrl') ?? '';
  }

  /** Daftar konten venue (publik). */
  async list(): Promise<VenueContentView[]> {
    return (await this.repo.findAll()).map(toVenueContentView);
  }

  /** Konten venue tunggal via venueRef (publik). */
  async getByRef(ref: string): Promise<VenueContentView> {
    const found = await this.repo.findByRef(ref);
    if (!found) throw new NotFoundError('Konten venue tidak ditemukan.');
    return toVenueContentView(found);
  }

  /** Buat/perbarui konten venue (admin). */
  async upsert(dto: UpsertVenueContentDto): Promise<VenueContentView> {
    const gallery = dto.gallery as Prisma.InputJsonValue | undefined;
    const imageConnect = dto.imageMediaId
      ? { connect: { id: dto.imageMediaId } }
      : undefined;

    const result = await this.repo.upsert(
      dto.venueRef,
      {
        venueRef: dto.venueRef,
        description: dto.description,
        imageMedia: imageConnect,
        gallery,
      },
      {
        description: dto.description,
        imageMedia: dto.imageMediaId
          ? { connect: { id: dto.imageMediaId } }
          : { disconnect: true },
        gallery,
      },
    );
    return toVenueContentView(result);
  }

  /** Hapus konten venue via venueRef (admin). */
  async remove(ref: string): Promise<{ id: string }> {
    const found = await this.repo.findByRef(ref);
    if (!found) throw new NotFoundError('Konten venue tidak ditemukan.');
    return this.repo.deleteByRef(ref);
  }

  /**
   * Proxy READ-ONLY daftar venue dari simpora2026 untuk dropdown admin.
   * Gagal/timeout dikembalikan sebagai available:false (tak mematahkan UI).
   */
  async fetchVenueSources(): Promise<VenueSources> {
    if (!this.simporaApiUrl) return { available: false, venues: [] };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${this.simporaApiUrl}/venues`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        this.logger.warn(`simpora venues HTTP ${res.status}`);
        return { available: false, venues: [] };
      }
      const body: unknown = await res.json();
      // Toleran terhadap pembungkus { data: [...] } maupun array langsung.
      const venues = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: unknown }).data)
          ? (body as { data: unknown[] }).data
          : [];
      return { available: true, venues };
    } catch (err) {
      this.logger.warn(`Gagal ambil venue simpora2026: ${String(err)}`);
      return { available: false, venues: [] };
    } finally {
      clearTimeout(timeout);
    }
  }
}
