/**
 * src/modules/categories/entities/category.entity.ts
 * View Category untuk panel: data rubrik + jumlah artikel terkait.
 */
import { Category } from '@prisma/client';

/** Category beserta hasil agregasi jumlah artikel (_count). */
export type CategoryWithCount = Category & {
  _count?: { articles: number };
};

/** Bentuk kategori yang dikembalikan ke client (urut + default + jumlah artikel). */
export interface CategoryView {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  position: number;
  isDefault: boolean;
  articleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Petakan entitas Category (opsional dgn _count) ke bentuk view. */
export function toCategoryView(c: CategoryWithCount): CategoryView {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    parentId: c.parentId,
    position: c.position,
    isDefault: c.isDefault,
    articleCount: c._count?.articles ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
