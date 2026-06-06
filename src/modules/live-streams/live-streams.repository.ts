/**
 * src/modules/live-streams/live-streams.repository.ts
 * Akses data LiveStream + baca master saklar streaming_enabled dari Setting.
 */
import { Injectable } from '@nestjs/common';
import { LiveStream, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository LiveStream: query kanal siaran + saklar siaran global. */
@Injectable()
export class LiveStreamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LiveStreamCreateInput): Promise<LiveStream> {
    return this.prisma.liveStream.create({ data });
  }

  findById(id: string): Promise<LiveStream | null> {
    return this.prisma.liveStream.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.LiveStreamUpdateInput): Promise<LiveStream> {
    return this.prisma.liveStream.update({ where: { id }, data });
  }

  delete(id: string): Promise<{ id: string }> {
    return this.prisma.liveStream.delete({
      where: { id },
      select: { id: true },
    });
  }

  /** Semua kanal urut tampilan (terbaru bila sortOrder sama). */
  findAll(): Promise<LiveStream[]> {
    return this.prisma.liveStream.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** Nilai boolean master saklar siaran (default false bila belum di-set). */
  async streamingEnabled(): Promise<boolean> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'streaming_enabled' },
      select: { value: true },
    });
    return setting?.value === true;
  }
}
