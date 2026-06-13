/** admin/src/composables/useDashboard.ts — server-state ringkasan dashboard. */
import { useQuery } from '@tanstack/vue-query';
import { dashboardApi } from '@/api/dashboard';

/** Ringkasan metrik CMS (KPI, tren, komposisi, butuh-aksi, top artikel). */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
  });
}
