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

/** Komentar lengkap untuk panel moderasi. */
export interface CommentModerationView {
  id: string;
  articleId: string;
  userId: string | null;
  authorName: string | null;
  body: string;
  status: string;
  createdAt: Date;
}

/** Petakan ke bentuk publik. */
export function toCommentView(c: Comment): CommentView {
  return {
    id: c.id,
    authorName: c.authorName,
    body: c.body,
    createdAt: c.createdAt,
  };
}

/** Petakan ke bentuk moderasi (lengkap dengan status). */
export function toCommentModerationView(c: Comment): CommentModerationView {
  return {
    id: c.id,
    articleId: c.articleId,
    userId: c.userId,
    authorName: c.authorName,
    body: c.body,
    status: c.status,
    createdAt: c.createdAt,
  };
}
