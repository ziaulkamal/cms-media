/**
 * src/modules/users/users.repository.ts
 * Lapisan akses data User (semua query Prisma terpusat di sini).
 */
import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Jumlah konten milik user yang harus dipindah sebelum user dihapus. */
export interface UserOwnership {
  articles: number;
  media: number;
  revisions: number;
}

/** Repository User: pembungkus query Prisma agar logika data reusable. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /** Konten yang menahan penghapusan user (relasi onDelete: Restrict). */
  async countOwnership(id: string): Promise<UserOwnership> {
    const [articles, media, revisions] = await this.prisma.$transaction([
      this.prisma.article.count({ where: { authorId: id } }),
      this.prisma.media.count({ where: { uploadedById: id } }),
      this.prisma.revision.count({ where: { editorId: id } }),
    ]);
    return { articles, media, revisions };
  }

  countActiveAdmins(excludeId: string): Promise<number> {
    return this.prisma.user.count({
      where: { role: UserRole.ADMIN, isActive: true, id: { not: excludeId } },
    });
  }

  /**
   * Hapus user dalam satu transaksi; bila `transferTo` diisi, artikel, media,
   * dan revisinya dipindah dulu ke user itu. Komentar: userId -> null (SetNull).
   */
  deleteWithTransfer(id: string, transferTo: string | null): Promise<unknown> {
    return this.prisma.$transaction(async (tx) => {
      if (transferTo) {
        await tx.article.updateMany({ where: { authorId: id }, data: { authorId: transferTo } });
        await tx.media.updateMany({ where: { uploadedById: id }, data: { uploadedById: transferTo } });
        await tx.revision.updateMany({ where: { editorId: id }, data: { editorId: transferTo } });
      }
      await tx.user.delete({ where: { id } });
    });
  }

  /** Ambil satu halaman user terurut terbaru beserta total untuk paginasi. */
  async paginate(skip: number, take: number): Promise<[User[], number]> {
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
  }
}
