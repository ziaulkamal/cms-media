/**
 * src/modules/comments/comments.service.ts
 * Aturan bisnis Comment: tulis (antre PENDING), moderasi, dan daftar publik.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Comment, CommentStatus } from '@prisma/client';
import { paginate } from '../../common/dto/paginated';
import {
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePublicCommentDto } from './dto/create-public-comment.dto';
import {
  buildCommentTree,
  CommentModerationStats,
  CommentModerationView,
  CommentTreeView,
  CommentView,
  toCommentModerationView,
  toCommentView,
} from './entities/comment.entity';

/** Service Comment: orkestrasi penulisan & moderasi komentar. */
@Injectable()
export class CommentsService {
  private readonly audit = new Logger('Audit');

  constructor(private readonly repo: CommentsRepository) {}

  /** Buat komentar berstatus PENDING pada artikel yang sudah terbit. */
  async create(dto: CreateCommentDto): Promise<CommentModerationView> {
    if (!(await this.repo.isArticleCommentable(dto.articleId))) {
      throw new ValidationError('Artikel tidak ditemukan atau belum terbit.');
    }
    const comment = await this.repo.create({
      article: { connect: { id: dto.articleId } },
      authorName: dto.authorName,
      body: dto.body,
      status: CommentStatus.PENDING,
    });
    return toCommentModerationView(comment);
  }

  /** Pohon komentar APPROVED suatu artikel (publik, via slug); tanpa email. */
  async listTreeBySlug(slug: string): Promise<CommentTreeView[]> {
    const articleId = await this.repo.findPublishedArticleIdBySlug(slug);
    if (!articleId) throw new NotFoundError('Artikel tidak ditemukan.');
    return buildCommentTree(await this.repo.findApprovedForTree(articleId));
  }

  /** Tulis komentar/balasan publik via slug; antre PENDING (rate-limited). */
  async createBySlug(
    slug: string,
    dto: CreatePublicCommentDto,
  ): Promise<CommentModerationView> {
    const articleId = await this.repo.findPublishedArticleIdBySlug(slug);
    if (!articleId) {
      throw new ValidationError('Artikel tidak ditemukan atau belum terbit.');
    }
    // Balasan hanya boleh menempel pada komentar APPROVED di artikel yang sama.
    if (dto.parentId) {
      const parent = await this.repo.findApprovedById(dto.parentId, articleId);
      if (!parent) throw new ValidationError('Komentar induk tidak valid.');
    }

    const comment = await this.repo.create({
      article: { connect: { id: articleId } },
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
      authorName: dto.authorName,
      authorEmail: dto.authorEmail,
      body: dto.body,
      status: CommentStatus.PENDING,
    });
    return toCommentModerationView(comment);
  }

  /** Tambah suka pada komentar APPROVED (dedup ditangani di controller). */
  async like(id: string): Promise<{ id: string; likeCount: number }> {
    const updated = await this.repo.incrementLike(id);
    if (!updated) throw new NotFoundError('Komentar tidak ditemukan.');
    return { id: updated.id, likeCount: updated.likeCount };
  }

  /** Jumlah suka komentar saat ini (untuk respons idempoten saat sudah disukai). */
  async likeCount(id: string): Promise<number> {
    const comment = await this.getOrFail(id);
    return comment.likeCount;
  }

  /** Daftar komentar APPROVED sebuah artikel (publik). */
  async listApproved(
    articleId: string,
    page: number,
    perPage: number,
  ): Promise<Paginated<CommentView>> {
    const [items, total] = await this.repo.paginateApproved(
      articleId,
      (page - 1) * perPage,
      perPage,
    );
    return paginate(items.map(toCommentView), total, page, perPage);
  }

  /** Daftar komentar untuk moderasi (editor ke atas). */
  async listForModeration(
    filter: { status?: CommentStatus; articleId?: string; page: number; perPage: number },
  ): Promise<Paginated<CommentModerationView>> {
    const [items, total] = await this.repo.paginateForModeration(
      { status: filter.status, articleId: filter.articleId },
      (filter.page - 1) * filter.perPage,
      filter.perPage,
    );
    return paginate(
      items.map(toCommentModerationView),
      total,
      filter.page,
      filter.perPage,
    );
  }

  /** Rekap jumlah komentar per status untuk header moderasi. */
  async moderationStats(): Promise<CommentModerationStats> {
    const rows = await this.repo.countByStatus();
    const count = (s: CommentStatus) =>
      rows.find((r) => r.status === s)?.count ?? 0;
    const pending = count(CommentStatus.PENDING);
    const approved = count(CommentStatus.APPROVED);
    const spam = count(CommentStatus.SPAM);
    return { total: pending + approved + spam, pending, approved, spam };
  }

  /** Setujui komentar (tampil ke publik). */
  async approve(id: string): Promise<CommentModerationView> {
    return this.setStatus(id, CommentStatus.APPROVED);
  }

  /** Tandai komentar sebagai spam (disembunyikan). */
  async markSpam(id: string): Promise<CommentModerationView> {
    return this.setStatus(id, CommentStatus.SPAM);
  }

  /** Ubah status komentar yang ada atau lempar NotFound. */
  private async setStatus(
    id: string,
    status: CommentStatus,
  ): Promise<CommentModerationView> {
    await this.getOrFail(id);
    const updated = await this.repo.updateStatus(id, status);
    this.audit.log(`comment.moderate id=${id} status=${status}`);
    return toCommentModerationView(updated);
  }

  private async getOrFail(id: string): Promise<Comment> {
    const comment = await this.repo.findById(id);
    if (!comment) throw new NotFoundError('Komentar tidak ditemukan.');
    return comment;
  }
}
