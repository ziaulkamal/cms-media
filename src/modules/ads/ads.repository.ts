/**
 * src/modules/ads/ads.repository.ts
 * Akses data Ads (slot & creative); termasuk query serving sesuai jadwal.
 */
import { Injectable } from '@nestjs/common';
import {
  AdCreative,
  AdCreativeStatus,
  AdPlatform,
  AdSlot,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Creative beserta slot induknya (dipakai saat serving untuk ambil dimensi). */
export type CreativeWithSlot = AdCreative & { slot: AdSlot };

/** Repository Ads: pembungkus query Prisma untuk slot dan creative. */
@Injectable()
export class AdsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Slot ---
  createSlot(data: Prisma.AdSlotCreateInput): Promise<AdSlot> {
    return this.prisma.adSlot.create({ data });
  }

  updateSlot(id: string, data: Prisma.AdSlotUpdateInput): Promise<AdSlot> {
    return this.prisma.adSlot.update({ where: { id }, data });
  }

  findSlotById(id: string): Promise<AdSlot | null> {
    return this.prisma.adSlot.findUnique({ where: { id } });
  }

  findSlotByKey(key: string): Promise<AdSlot | null> {
    return this.prisma.adSlot.findUnique({ where: { key } });
  }

  findAllSlots(): Promise<AdSlot[]> {
    return this.prisma.adSlot.findMany({ orderBy: { key: 'asc' } });
  }

  // --- Creative ---
  createCreative(data: Prisma.AdCreativeCreateInput): Promise<AdCreative> {
    return this.prisma.adCreative.create({ data });
  }

  updateCreative(
    id: string,
    data: Prisma.AdCreativeUpdateInput,
  ): Promise<AdCreative> {
    return this.prisma.adCreative.update({ where: { id }, data });
  }

  findCreativeById(id: string): Promise<AdCreative | null> {
    return this.prisma.adCreative.findUnique({ where: { id } });
  }

  findCreativesBySlot(slotId: string): Promise<AdCreative[]> {
    return this.prisma.adCreative.findMany({
      where: { slotId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Creative eligible tayang untuk sebuah key slot pada waktu `now` dan platform tertentu.
   * Eligible = status ACTIVE, slot aktif (AMP harus aktif utk platform AMP), dalam window jadwal.
   */
  findServable(
    key: string,
    now: Date,
    platform: 'WEB' | 'AMP',
  ): Promise<CreativeWithSlot[]> {
    const platformMatch: AdPlatform[] =
      platform === 'AMP'
        ? [AdPlatform.AMP, AdPlatform.BOTH]
        : [AdPlatform.WEB, AdPlatform.BOTH];

    return this.prisma.adCreative.findMany({
      where: {
        status: AdCreativeStatus.ACTIVE,
        platform: { in: platformMatch },
        slot:
          platform === 'AMP'
            ? { key, isActive: true, isAmpEnabled: true }
            : { key, isActive: true },
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      include: { slot: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
