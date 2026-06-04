/**
 * src/modules/articles/entities/article.entity.ts
 * Bentuk publik Article + mapper dari entity Prisma (sembunyikan kolom internal spt tsv).
 */
import { Prisma } from '@prisma/client';
import { mediaPublicUrl } from '../../../common/utils/media-url';

/** Relasi yang selalu disertakan saat mengambil artikel. */
export const articleInclude = {
  author: { select: { id: true, name: true } },
  category: { select: { id: true, slug: true, name: true } },
  tags: { include: { tag: { select: { id: true, slug: true, name: true } } } },
  featuredMedia: {
    select: { id: true, storageKey: true, mimeType: true, alt: true },
  },
} satisfies Prisma.ArticleInclude;

/** Tipe artikel beserta relasi terpilih. */
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

/** Representasi Article yang aman & rapi untuk client. */
export interface ArticleView {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: unknown;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  author: { id: string; name: string };
  category: { id: string; slug: string; name: string } | null;
  tags: { id: string; slug: string; name: string }[];
  featuredMedia: { id: string; url: string; alt: string | null } | null;
}

/** Petakan entity Prisma (+relasi) ke ArticleView; kolom tsv tidak ikut. */
export function toArticleView(a: ArticleWithRelations): ArticleView {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.body,
    status: a.status,
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    author: a.author,
    category: a.category,
    tags: a.tags.map((t) => t.tag),
    featuredMedia: a.featuredMedia
      ? {
          id: a.featuredMedia.id,
          url: mediaPublicUrl(a.featuredMedia.storageKey),
          alt: a.featuredMedia.alt,
        }
      : null,
  };
}
