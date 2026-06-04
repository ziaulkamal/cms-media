/**
 * admin/src/stores/auth.ts
 * State autentikasi: user dari /auth/me, aksi login/logout/fetchMe, cek role.
 */
import { defineStore } from 'pinia';
import { authApi } from '@/api/auth';
import type { LoginPayload, User, UserRole } from '@/types/cms';

interface AuthState {
  user: User | null;
  /** True setelah fetchMe pertama selesai (sukses/gagal) — agar guard tak loop. */
  loaded: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ user: null, loaded: false }),

  getters: {
    isAuthenticated: (s): boolean => s.user !== null,
    role: (s): UserRole | null => s.user?.role ?? null,
  },

  actions: {
    /** Login lalu simpan profil yang dikembalikan server. */
    async login(payload: LoginPayload): Promise<void> {
      this.user = await authApi.login(payload);
      this.loaded = true;
    },

    /** Ambil profil saat ini; null bila tidak terautentikasi. */
    async fetchMe(): Promise<void> {
      try {
        this.user = await authApi.me();
      } catch {
        this.user = null;
      } finally {
        this.loaded = true;
      }
    },

    /** Logout di server lalu bersihkan state lokal. */
    async logout(): Promise<void> {
      try {
        await authApi.logout();
      } finally {
        this.user = null;
      }
    },

    /** True bila role user termasuk salah satu yang diizinkan. */
    hasRole(...roles: UserRole[]): boolean {
      return this.user ? roles.includes(this.user.role) : false;
    },
  },
});
