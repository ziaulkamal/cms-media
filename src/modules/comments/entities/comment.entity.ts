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

/** Node komentar publik berjenjang: tanpa email, plus suka & badge panitia. */
export interface CommentTreeView {
  id: string;
  authorName: string | null;
  body: string;
  likeCount: number;
  isAdmin: boolean;
  createdAt: Date;
  replies: CommentTreeView[];
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
  parentId: string | null;
  authorName: string | null;
  body: string;
  status: string;
  likeCount: number;
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

/** Komentar mentah utk bangun tree: butuh relasi user (deteksi badge panitia). */
export type CommentForTree = Comment & {
  user?: { id: string; role: string } | null;
};

/**
 * Bangun pohon komentar APPROVED dari daftar datar (root + replies berjenjang).
 * Email tidak pernah diekspos; isAdmin = komentar oleh staf (punya akun user).
 */
export function buildCommentTree(flat: CommentForTree[]): CommentTreeView[] {
  const nodes = new Map<string, CommentTreeView>();
  for (const c of flat) {
    nodes.set(c.id, {
      id: c.id,
      authorName: c.authorName,
      body: c.body,
      likeCount: c.likeCount,
      isAdmin: c.user != null,
      createdAt: c.createdAt,
      replies: [],
    });
  }

  const roots: CommentTreeView[] = [];
  for (const c of flat) {
    const node = nodes.get(c.id)!;
    const parent = c.parentId ? nodes.get(c.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
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

/** Petakan ke bentuk moderasi (lengkap dengan status & artikel asal). */
export function toCommentModerationView(
  c: CommentWithArticle,
): CommentModerationView {
  return {
    id: c.id,
    articleId: c.articleId,
    userId: c.userId,
    parentId: c.parentId,
    authorName: c.authorName,
    body: c.body,
    status: c.status,
    likeCount: c.likeCount,
    createdAt: c.createdAt,
    article: c.article ?? null,
  };
}
