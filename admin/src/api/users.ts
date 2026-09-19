/** admin/src/api/users.ts — endpoint pengelolaan staf (khusus ADMIN). */
import type {
  CreateUserPayload,
  ResetPasswordResult,
  SetPasswordPayload,
  SuccessEnvelope,
  UpdateUserPayload,
  User,
  UserOwnership,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const usersApi = {
  list: (page = 1, perPage = 20) =>
    unwrapPaginated<User>(
      http.get<SuccessEnvelope<User[]>>('/admin/users', {
        params: { page, perPage },
      }),
    ),

  get: (id: string) =>
    unwrap<User>(http.get<SuccessEnvelope<User>>(`/admin/users/${id}`)),

  create: (payload: CreateUserPayload) =>
    unwrap<User>(http.post<SuccessEnvelope<User>>('/admin/users', payload)),

  update: (id: string, payload: UpdateUserPayload) =>
    unwrap<User>(
      http.patch<SuccessEnvelope<User>>(`/admin/users/${id}`, payload),
    ),

  /** Tetapkan password spesifik untuk user terpilih. */
  setPassword: (id: string, payload: SetPasswordPayload) =>
    unwrap<User>(
      http.patch<SuccessEnvelope<User>>(
        `/admin/users/${id}/password`,
        payload,
      ),
    ),

  /** Reset password user ke nilai acak; balikan plaintext sekali tampil. */
  resetPassword: (id: string) =>
    unwrap<ResetPasswordResult>(
      http.post<SuccessEnvelope<ResetPasswordResult>>(
        `/admin/users/${id}/password/reset`,
      ),
    ),

  /** Jumlah artikel/media/revisi milik user (perlu dipindah sebelum hapus). */
  ownership: (id: string) =>
    unwrap<UserOwnership>(
      http.get<SuccessEnvelope<UserOwnership>>(`/admin/users/${id}/ownership`),
    ),

  /** Hapus user; konten dipindah ke `transferTo` bila diisi. */
  remove: (id: string, transferTo?: string) =>
    unwrap<{ id: string; transferred: UserOwnership | null }>(
      http.delete<SuccessEnvelope<{ id: string; transferred: UserOwnership | null }>>(
        `/admin/users/${id}`,
        { params: transferTo ? { transferTo } : undefined },
      ),
    ),
};
