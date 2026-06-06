/**
 * src/modules/tags/tags.repository.ts
 * Akses data Tag (query Prisma terpusat).
 */
import { Injectable } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository Tag: pembungkus query Prisma. */
@Injectable()
export class TagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TagCreateInput): Promise<Tag> {
    return this.prisma.tag.create({ data });
  }

  update(id: string, data: Prisma.TagUpdateInput): Promise<Tag> {
    return this.prisma.tag.update({ where: { id }, data });
  }

  delete(id: string): Promise<Tag> {
    return this.prisma.tag.delete({ where: { id } });
  }

  async deleteMany(ids: string[]): Promise<number> {
    const { count } = await this.prisma.tag.deleteMany({
      where: { id: { in: ids } },
    });
    return count;
  }

  findById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  /** Apakah slug sudah dipakai (kecualikan id tertentu saat update). */
  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.tag.findUnique({
      where: { slug },
      select: { id: true },
    });
    return found !== null && found.id !== exceptId;
  }
}
