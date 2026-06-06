/**
 * src/modules/media/media.repository.ts
 * Akses data Media (metadata berkas); file fisik dikelola StoragePort.
 */
import { Injectable } from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository Media: pembungkus query Prisma untuk metadata aset. */
@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MediaCreateInput): Promise<Media> {
    return this.prisma.media.create({ data });
  }

  findById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.MediaUpdateInput): Promise<Media> {
    return this.prisma.media.update({ where: { id }, data });
  }

  delete(id: string): Promise<Media> {
    return this.prisma.media.delete({ where: { id } });
  }

  findManyByIds(ids: string[]): Promise<Media[]> {
    return this.prisma.media.findMany({ where: { id: { in: ids } } });
  }

  async deleteMany(ids: string[]): Promise<number> {
    const { count } = await this.prisma.media.deleteMany({
      where: { id: { in: ids } },
    });
    return count;
  }

  /** Satu halaman media terbaru beserta totalnya. */
  async paginate(skip: number, take: number): Promise<[Media[], number]> {
    return this.prisma.$transaction([
      this.prisma.media.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count(),
    ]);
  }
}
