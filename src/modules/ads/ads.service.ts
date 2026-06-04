/**
 * src/modules/ads/ads.service.ts
 * Aturan bisnis Ads: kelola slot/creative, validasi per-kind & platform, serving.
 */
import { Injectable } from '@nestjs/common';
import {
  AdCreative,
  AdCreativeKind,
  AdPlatform,
  AdSlot,
} from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { AdsRepository } from './ads.repository';
import { CreateAdCreativeDto } from './dto/create-ad-creative.dto';
import { CreateAdSlotDto } from './dto/create-ad-slot.dto';
import { UpdateAdCreativeDto } from './dto/update-ad-creative.dto';
import { UpdateAdSlotDto } from './dto/update-ad-slot.dto';
import {
  AdCreativeView,
  AdServeView,
  AdSlotView,
  toAdCreativeView,
  toAdServeView,
  toAdSlotView,
} from './entities/ad.entity';

/** Service Ads: orkestrasi slot, creative, dan logika serving iklan. */
@Injectable()
export class AdsService {
  constructor(private readonly repo: AdsRepository) {}

  // --- Slot (kelola) ---

  /** Buat slot; key wajib unik. */
  async createSlot(dto: CreateAdSlotDto): Promise<AdSlotView> {
    if (await this.repo.findSlotByKey(dto.key)) {
      throw new ConflictError('Key slot sudah dipakai.');
    }
    const slot = await this.repo.createSlot({
      key: dto.key,
      name: dto.name,
      description: dto.description,
      width: dto.width,
      height: dto.height,
      isAmpEnabled: dto.isAmpEnabled,
      isActive: dto.isActive,
    });
    return toAdSlotView(slot);
  }

  /** Ubah slot. */
  async updateSlot(id: string, dto: UpdateAdSlotDto): Promise<AdSlotView> {
    await this.getSlotOrFail(id);
    const slot = await this.repo.updateSlot(id, dto);
    return toAdSlotView(slot);
  }

  /** Daftar semua slot. */
  async listSlots(): Promise<AdSlotView[]> {
    const slots = await this.repo.findAllSlots();
    return slots.map(toAdSlotView);
  }

  // --- Creative (kelola) ---

  /** Tambah creative ke slot; validasi jadwal, kind, dan platform. */
  async createCreative(
    slotId: string,
    dto: CreateAdCreativeDto,
  ): Promise<AdCreativeView> {
    await this.getSlotOrFail(slotId);
    this.assertScheduleValid(dto.startAt, dto.endAt);
    this.assertPlatformValid(dto.kind, dto.platform);

    const creative = await this.repo.createCreative({
      slot: { connect: { id: slotId } },
      kind: dto.kind,
      platform: dto.platform,
      status: dto.status,
      name: dto.name,
      imageUrl: dto.imageUrl,
      targetUrl: dto.targetUrl,
      alt: dto.alt,
      htmlSnippet: dto.htmlSnippet,
      adClient: dto.adClient,
      adSlot: dto.adSlot,
      adFormat: dto.adFormat,
      width: dto.width,
      height: dto.height,
      priority: dto.priority,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    });
    return toAdCreativeView(creative);
  }

  /** Ubah creative. */
  async updateCreative(
    id: string,
    dto: UpdateAdCreativeDto,
  ): Promise<AdCreativeView> {
    const current = await this.getCreativeOrFail(id);
    this.assertScheduleValid(dto.startAt, dto.endAt);
    this.assertPlatformValid(dto.kind ?? current.kind, dto.platform);

    const creative = await this.repo.updateCreative(id, {
      kind: dto.kind,
      platform: dto.platform,
      status: dto.status,
      name: dto.name,
      imageUrl: dto.imageUrl,
      targetUrl: dto.targetUrl,
      alt: dto.alt,
      htmlSnippet: dto.htmlSnippet,
      adClient: dto.adClient,
      adSlot: dto.adSlot,
      adFormat: dto.adFormat,
      width: dto.width,
      height: dto.height,
      priority: dto.priority,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    });
    return toAdCreativeView(creative);
  }

  /** Daftar creative pada sebuah slot. */
  async listCreatives(slotId: string): Promise<AdCreativeView[]> {
    await this.getSlotOrFail(slotId);
    const creatives = await this.repo.findCreativesBySlot(slotId);
    return creatives.map(toAdCreativeView);
  }

  // --- Serving (publik) ---

  /** Creative eligible untuk sebuah key slot pada platform tertentu (urut prioritas). */
  async serve(key: string, platform: 'WEB' | 'AMP'): Promise<AdServeView[]> {
    const creatives = await this.repo.findServable(key, new Date(), platform);
    return creatives.map((c) => toAdServeView(c, c.slot));
  }

  // --- Helper ---

  /** Pastikan endAt tidak mendahului startAt. */
  private assertScheduleValid(startAt?: string, endAt?: string): void {
    if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
      throw new ValidationError('endAt tidak boleh sebelum startAt.');
    }
  }

  /** HTML custom tidak valid di AMP — paksa platform WEB. */
  private assertPlatformValid(
    kind: AdCreativeKind,
    platform?: AdPlatform,
  ): void {
    if (
      kind === AdCreativeKind.HOUSE_HTML &&
      platform &&
      platform !== AdPlatform.WEB
    ) {
      throw new ValidationError(
        'HOUSE_HTML hanya didukung di platform WEB (bukan AMP).',
      );
    }
  }

  private async getSlotOrFail(id: string): Promise<AdSlot> {
    const slot = await this.repo.findSlotById(id);
    if (!slot) throw new NotFoundError('Slot iklan tidak ditemukan.');
    return slot;
  }

  private async getCreativeOrFail(id: string): Promise<AdCreative> {
    const creative = await this.repo.findCreativeById(id);
    if (!creative) throw new NotFoundError('Creative tidak ditemukan.');
    return creative;
  }
}
