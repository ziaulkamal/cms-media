/**
 * admin/src/api/http.ts
 * Klien axios: kirim cookie (withCredentials), inject CSRF, unwrap envelope,
 * dan refresh-once otomatis saat 401.
 */
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ErrorEnvelope, Paginated, SuccessEnvelope } from '@/types/cms';

const CSRF_COOKIE = 'csrf_token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/** Error API ter-normalisasi (kode mesin + pesan + detail validasi). */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Baca nilai cookie by name dari document.cookie. */
function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Petakan error axios -> ApiError seragam (tanpa membocorkan internal). */
function toApiError(error: AxiosError<ErrorEnvelope>): ApiError {
  const body = error.response?.data;
  if (body && body.success === false) {
    return new ApiError(
      body.error.code,
      body.error.message,
      body.error.details,
      error.response?.status,
    );
  }
  return new ApiError(
    'NETWORK_ERROR',
    error.message || 'Gagal terhubung ke server.',
    undefined,
    error.response?.status,
  );
}

/** Arahkan ke halaman login saat sesi benar-benar habis (hindari loop). */
function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// CSRF pada mutasi + matikan cache pada GET (admin selalu butuh data terkini).
http.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase();
  if (!SAFE_METHODS.includes(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) config.headers.set('X-CSRF-Token', token);
  } else {
    // Endpoint publik di-cache (Cache-Control); paksa revalidasi agar tak basi.
    config.headers.set('Cache-Control', 'no-cache');
    config.headers.set('Pragma', 'no-cache');
  }
  return config;
});

let refreshing: Promise<unknown> | null = null;

// 401 -> coba refresh sekali -> ulang request; gagal -> ke /login.
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshing = refreshing ?? http.post('/auth/refresh');
        await refreshing;
        return http(original);
      } catch {
        redirectToLogin();
        return Promise.reject(toApiError(error));
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(toApiError(error));
  },
);

/** Buka envelope sukses tunggal -> data. */
export async function unwrap<T>(
  promise: Promise<AxiosResponse<SuccessEnvelope<T>>>,
): Promise<T> {
  return (await promise).data.data;
}

/** Buka envelope list -> { items, meta }. */
export async function unwrapPaginated<T>(
  promise: Promise<AxiosResponse<SuccessEnvelope<T[]>>>,
): Promise<Paginated<T>> {
  const env = (await promise).data;
  return {
    items: env.data,
    meta: env.meta ?? {
      page: 1,
      perPage: env.data.length,
      total: env.data.length,
      totalPages: 1,
    },
  };
}
