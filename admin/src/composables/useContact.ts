/** admin/src/composables/useContact.ts — server-state inbox kontak. */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { type ComputedRef } from 'vue';
import { contactApi } from '@/api/contact';
import type { ContactQuery, ContactStatus } from '@/types/cms';

/** Daftar pesan inbox (filter reaktif). */
export function useContactQuery(params: ComputedRef<ContactQuery>) {
  return useQuery({
    queryKey: ['contact', params],
    queryFn: () => contactApi.list(params.value),
    placeholderData: keepPreviousData,
  });
}

/** Rekap jumlah pesan per status (badge NEW). */
export function useContactStatsQuery() {
  return useQuery({
    queryKey: ['contact', 'stats'],
    queryFn: () => contactApi.stats(),
  });
}

/** Mutasi inbox; invalidate daftar + rekap pada sukses. */
export function useContactMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['contact'] });

  return {
    updateStatus: useMutation({
      mutationFn: (vars: { id: string; status: ContactStatus }) =>
        contactApi.updateStatus(vars.id, vars.status),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => contactApi.remove(id),
      onSuccess: invalidate,
    }),
  };
}
