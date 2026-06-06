/**
 * src/modules/contact/contact.repository.ts
 * Akses data ContactMessage terpusat (query Prisma).
 */
import { Injectable } from '@nestjs/common';
import { ContactMessage, ContactStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository ContactMessage: pembungkus query inbox kontak. */
@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ContactMessageCreateInput): Promise<ContactMessage> {
    return this.prisma.contactMessage.create({ data });
  }

  findById(id: string): Promise<ContactMessage | null> {
    return this.prisma.contactMessage.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: ContactStatus): Promise<ContactMessage> {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }

  delete(id: string): Promise<{ id: string }> {
    return this.prisma.contactMessage.delete({
      where: { id },
      select: { id: true },
    });
  }

  /** Daftar pesan dengan filter status opsional, terbaru dulu. */
  async paginate(
    status: ContactStatus | undefined,
    skip: number,
    take: number,
  ): Promise<[ContactMessage[], number]> {
    const where: Prisma.ContactMessageWhereInput = { status };
    return this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
  }

  /** Rekap jumlah pesan per status. */
  async countByStatus(): Promise<
    Array<{ status: ContactStatus; count: number }>
  > {
    const rows = await this.prisma.contactMessage.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }
}
