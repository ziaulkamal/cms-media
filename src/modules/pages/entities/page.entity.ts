/**
 * src/modules/pages/entities/page.entity.ts
 * Bentuk publik Page + mapper dari entity Prisma.
 */
import { Page } from '@prisma/client';

/** Representasi Page yang dikirim ke client. */
export interface PageView {
  id: string;
  slug: string;
  title: string;
  body: unknown;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Petakan entity Prisma ke PageView. */
export function toPageView(p: Page): PageView {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    body: p.body,
    status: p.status,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    isMandatory: p.isMandatory,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
