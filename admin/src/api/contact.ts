/** admin/src/api/contact.ts — endpoint inbox kontak (editor ke atas). */
import type {
  ContactMessage,
  ContactQuery,
  ContactStats,
  ContactStatus,
  SuccessEnvelope,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const contactApi = {
  list: (query: ContactQuery = {}) =>
    unwrapPaginated<ContactMessage>(
      http.get<SuccessEnvelope<ContactMessage[]>>('/contact', {
        params: query,
      }),
    ),

  stats: () =>
    unwrap<ContactStats>(http.get<SuccessEnvelope<ContactStats>>('/contact/stats')),

  get: (id: string) =>
    unwrap<ContactMessage>(
      http.get<SuccessEnvelope<ContactMessage>>(`/contact/${id}`),
    ),

  updateStatus: (id: string, status: ContactStatus) =>
    unwrap<ContactMessage>(
      http.patch<SuccessEnvelope<ContactMessage>>(`/contact/${id}`, { status }),
    ),

  remove: (id: string) => http.delete(`/contact/${id}`),
};
