/**
 * src/modules/contact/entities/contact-message.entity.ts
 * View & mapper ContactMessage (inbox admin) + rekap status untuk badge.
 */
import { ContactMessage } from '@prisma/client';

/** Pesan kontak untuk panel inbox admin. */
export interface ContactMessageView {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/** Rekap jumlah pesan per status (untuk badge NEW di admin). */
export interface ContactStats {
  total: number;
  new: number;
  read: number;
  replied: number;
  spam: number;
  archived: number;
}

/** Petakan entity Prisma ke ContactMessageView. */
export function toContactMessageView(c: ContactMessage): ContactMessageView {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    subject: c.subject,
    message: c.message,
    status: c.status,
    ipAddress: c.ipAddress,
    userAgent: c.userAgent,
    createdAt: c.createdAt,
  };
}
