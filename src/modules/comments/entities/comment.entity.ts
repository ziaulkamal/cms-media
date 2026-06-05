/**
 * src/modules/comments/entities/comment.entity.ts
 * View & mapper Comment: bentuk publik (ringkas) vs bentuk moderasi (lengkap).
 */
import { Comment } from '@prisma/client';

/** Komentar yang aman ditampilkan publik (tanpa status/relasi internal). */
export interface CommentView {
  id: string;
  authorName: string | null;
  body: string;
  createdAt: Date;
}

/** Ringkasan artikel asal komentar (untuk panel moderasi). */
export interface CommentArticleRef {
  id: string;
  title: string;
  slug: string;
}

/** Komentar lengkap untuk panel moderasi. */
export interface CommentModerationView {
  id: string;
  articleId: string;
  userId: string | null;
  authorName: string | null;
  body: string;
  status: string;
  createdAt: Date;
  article: CommentArticleRef | null;
}

/** Rekap jumlah komentar per status untuk header moderasi. */
export interface CommentModerationStats {
  total: number;
  pending: number;
  approved: number;
  spam: number;
}

/** Comment opsional dengan relasi article ter-include (input mapper moderasi). */
type CommentWithArticle = Comment & { article?: CommentArticleRef | null };

/** Petakan ke bentuk publik. */
export function toCommentView(c: Comment): CommentView {
  return {
    id: c.id,
    authorName: c.authorName,
    body: c.body,
    createdAt: c.createdAt,
  };
}

/** Petakan ke bentuk moderasi (lengkap dengan status & artikel asal). */
export function toCommentModerationView(
  c: CommentWithArticle,
): CommentModerationView {
  return {
    id: c.id,
    articleId: c.articleId,
    userId: c.userId,
    authorName: c.authorName,
    body: c.body,
    status: c.status,
    createdAt: c.createdAt,
    article: c.article ?? null,
  };
}
