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
import {
  CommentModerationStats,
  CommentModerationView,
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
