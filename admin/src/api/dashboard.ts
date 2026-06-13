/** admin/src/api/dashboard.ts — ringkasan agregasi dashboard (semua staf). */
import type { DashboardStats, SuccessEnvelope } from '@/types/cms';
import { http, unwrap } from './http';

export const dashboardApi = {
  /** Ambil seluruh metrik dashboard dalam satu request. */
  stats: () =>
    unwrap<DashboardStats>(
      http.get<SuccessEnvelope<DashboardStats>>('/dashboard/stats'),
    ),
};
