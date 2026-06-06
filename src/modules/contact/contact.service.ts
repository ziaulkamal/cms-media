/**
 * src/modules/contact/contact.service.ts
 * Aturan bisnis ContactMessage: terima pesan publik (anti-bot) + kelola inbox.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ContactMessage, ContactStatus } from '@prisma/client';
import { paginate } from '../../common/dto/paginated';
import { NotFoundError } from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  ContactMessageView,
  ContactStats,
  toContactMessageView,
} from './entities/contact-message.entity';
import { ContactRepository } from './contact.repository';

/** Metadata teknis request (untuk audit & anti-spam). */
export interface ContactMeta {
  ipAddress?: string;
  userAgent?: string;
}

/** Service ContactMessage: penerimaan pesan + moderasi inbox. */
@Injectable()
export class ContactService {
  private readonly audit = new Logger('Audit');

  constructor(private readonly repo: ContactRepository) {}

  /** Terima pesan kontak; honeypot terisi → tandai SPAM (tetap balas sukses). */
  async submit(
    dto: CreateContactDto,
    meta: ContactMeta,
  ): Promise<{ received: true }> {
    const isBot = Boolean(dto.website && dto.website.trim().length > 0);
    await this.repo.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      status: isBot ? ContactStatus.SPAM : ContactStatus.NEW,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    // Respons seragam agar bot tak bisa membedakan diterima/ditolak.
    return { received: true };
  }

  /** Daftar inbox dengan filter status (admin). */
  async list(query: ContactQueryDto): Promise<Paginated<ContactMessageView>> {
    const [items, total] = await this.repo.paginate(
      query.status,
      query.skip,
      query.perPage,
    );
    return paginate(
      items.map(toContactMessageView),
      total,
      query.page,
      query.perPage,
    );
  }

  /** Detail satu pesan (admin). */
  async getById(id: string): Promise<ContactMessageView> {
    return toContactMessageView(await this.getOrFail(id));
  }

  /** Ubah status pesan (admin). */
  async updateStatus(
    id: string,
    status: ContactStatus,
  ): Promise<ContactMessageView> {
    await this.getOrFail(id);
    const updated = await this.repo.updateStatus(id, status);
    this.audit.log(`contact.status id=${id} status=${status}`);
    return toContactMessageView(updated);
  }

  /** Hapus pesan (admin). */
  async remove(id: string): Promise<{ id: string }> {
    await this.getOrFail(id);
    return this.repo.delete(id);
  }

  /** Rekap jumlah pesan per status (badge NEW). */
  async stats(): Promise<ContactStats> {
    const rows = await this.repo.countByStatus();
    const count = (s: ContactStatus) =>
      rows.find((r) => r.status === s)?.count ?? 0;
    const newCount = count(ContactStatus.NEW);
    const read = count(ContactStatus.READ);
    const replied = count(ContactStatus.REPLIED);
    const spam = count(ContactStatus.SPAM);
    const archived = count(ContactStatus.ARCHIVED);
    return {
      total: newCount + read + replied + spam + archived,
      new: newCount,
      read,
      replied,
      spam,
      archived,
    };
  }

  private async getOrFail(id: string): Promise<ContactMessage> {
    const message = await this.repo.findById(id);
    if (!message) throw new NotFoundError('Pesan tidak ditemukan.');
    return message;
  }
}
