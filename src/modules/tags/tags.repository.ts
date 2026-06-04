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

  findBySlug(slug: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.tag.findUnique({
      where: { slug },
      select: { id: true },
    });
    return found !== null;
  }
}
