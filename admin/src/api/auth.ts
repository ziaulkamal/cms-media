/** admin/src/api/auth.ts — endpoint autentikasi berbasis cookie. */
import type {
  ChangePasswordPayload,
  LoginPayload,
  SuccessEnvelope,
  User,
} from '@/types/cms';
import { http, unwrap } from './http';

export const authApi = {
  /** Login: set httpOnly cookie + CSRF di server, balikan profil user. */
  login: (payload: LoginPayload) =>
    unwrap<User>(http.post<SuccessEnvelope<User>>('/auth/login', payload)),

  /** Profil pengguna saat ini (sumber role untuk SPA). */
  me: () => unwrap<User>(http.get<SuccessEnvelope<User>>('/auth/me')),

  /** Logout: hapus cookie auth di server. */
  logout: () => http.post('/auth/logout'),

  /** Ganti password mandiri (butuh password lama). */
  changePassword: (payload: ChangePasswordPayload) =>
    http.patch('/auth/password', payload),
};
