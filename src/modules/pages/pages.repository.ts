/**
 * src/modules/pages/pages.repository.ts
 * Akses data Page: query Prisma ter-paginasi + lookup slug.
 */
import { Injectable } from '@nestjs/common';
import { Page, PageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository Page: pembungkus query (reusable, parameterized). */
@Injectable()
export class PagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PageCreateInput): Promise<Page> {
    return this.prisma.page.create({ data });
  }

  findById(id: string): Promise<Page | null> {
    return this.prisma.page.findUnique({ where: { id } });
  }

  findPublishedBySlug(slug: string): Promise<Page | null> {
    return this.prisma.page.findFirst({
      where: { slug, status: PageStatus.PUBLISHED },
    });
  }

  update(id: string, data: Prisma.PageUpdateInput): Promise<Page> {
    return this.prisma.page.update({ where: { id }, data });
  }

  delete(id: string): Promise<Page> {
    return this.prisma.page.delete({ where: { id } });
  }

  /** Apakah slug sudah dipakai (kecualikan id tertentu saat update). */
  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.page.findUnique({
      where: { slug },
      select: { id: true },
    });
    return found !== null && found.id !== exceptId;
  }

  /** Daftar halaman ter-paginasi dengan filter status opsional. */
  async paginate(
    status: PageStatus | undefined,
    skip: number,
    take: number,
  ): Promise<[Page[], number]> {
    const where: Prisma.PageWhereInput = { status };
    return this.prisma.$transaction([
      this.prisma.page.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.page.count({ where }),
    ]);
  }
}
