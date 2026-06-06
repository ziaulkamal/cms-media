/**
 * src/modules/categories/categories.repository.ts
 * Akses data Category (query Prisma terpusat): hierarki, urutan, & kategori default.
 */
import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryWithCount } from './entities/category.entity';

/** Slug kategori bawaan untuk artikel tanpa kategori. */
export const DEFAULT_CATEGORY_SLUG = 'article';

/** Satu simpul susunan baru (untuk reorder pohon). */
export interface CategoryPosition {
  id: string;
  parentId: string | null;
  position: number;
}

/** Repository Category: pembungkus query Prisma. */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  /** Seluruh kategori + jumlah artikel, urut jenjang lalu posisi lalu nama. */
  findAll(): Promise<CategoryWithCount[]> {
    return this.prisma.category.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return found !== null;
  }

  /** Posisi terbesar di antara saudara (sibling) sebuah induk; -1 bila kosong. */
  async maxPositionAmong(parentId: string | null): Promise<number> {
    const top = await this.prisma.category.findFirst({
      where: { parentId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return top?.position ?? -1;
  }

  /** Kategori default (bawaan) bila ada. */
  findDefault(): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { isDefault: true } });
  }

  /** Jamin kategori default ada (upsert by slug) lalu kembalikan. */
  ensureDefault(): Promise<Category> {
    return this.prisma.category.upsert({
      where: { slug: DEFAULT_CATEGORY_SLUG },
      update: { isDefault: true, parentId: null },
      create: {
        slug: DEFAULT_CATEGORY_SLUG,
        name: 'Article',
        isDefault: true,
        position: 0,
      },
    });
  }

  /** Terapkan susunan baru (induk + posisi) seluruh pohon dalam satu transaksi. */
  async applyOrder(items: CategoryPosition[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.category.update({
          where: { id: it.id },
          data: { parentId: it.parentId, position: it.position },
        }),
      ),
    );
  }

  /** Pindahkan artikel tanpa kategori ke kategori default; kembalikan jumlahnya. */
  async reassignOrphanArticles(defaultId: string): Promise<number> {
    const { count } = await this.prisma.article.updateMany({
      where: { categoryId: null },
      data: { categoryId: defaultId },
    });
    return count;
  }

  /** Pindahkan artikel ke kategori default lalu hapus satu kategori (atomik). */
  async deleteWithReassign(id: string, defaultId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.article.updateMany({
        where: { categoryId: id },
        data: { categoryId: defaultId },
      }),
      this.prisma.category.delete({ where: { id } }),
    ]);
  }

  /** Pindahkan artikel ke default lalu hapus banyak kategori (atomik). */
  async deleteManyWithReassign(
    ids: string[],
    defaultId: string,
  ): Promise<number> {
    const [, removed] = await this.prisma.$transaction([
      this.prisma.article.updateMany({
        where: { categoryId: { in: ids } },
        data: { categoryId: defaultId },
      }),
      this.prisma.category.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return removed.count;
  }
}
