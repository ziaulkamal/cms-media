/** admin/src/api/users.ts — endpoint pengelolaan staf (khusus ADMIN). */
import type {
  CreateUserPayload,
  SuccessEnvelope,
  UpdateUserPayload,
  User,
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
};
