/** admin/src/composables/useAds.ts — server-state slot & creative iklan. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import { adsApi } from '@/api/ads';
import type {
  CreateAdCreativePayload,
  CreateAdSlotPayload,
  UpdateAdCreativePayload,
  UpdateAdSlotPayload,
} from '@/types/cms';

/** Daftar seluruh slot iklan. */
export function useAdSlotsQuery() {
  return useQuery({ queryKey: ['ad-slots'], queryFn: () => adsApi.listSlots() });
}

/** Mutasi slot; invalidate daftar slot pada sukses. */
export function useAdSlotMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['ad-slots'] });

  return {
    create: useMutation({
      mutationFn: (payload: CreateAdSlotPayload) => adsApi.createSlot(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateAdSlotPayload }) =>
        adsApi.updateSlot(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
  };
}

/** Daftar creative untuk slot terpilih (enabled saat slotId ada). */
export function useAdCreativesQuery(slotId: ComputedRef<string | undefined>) {
  return useQuery({
    queryKey: ['ad-creatives', slotId],
    enabled: computed(() => !!slotId.value),
    queryFn: () => adsApi.listCreatives(slotId.value as string),
  });
}

/** Mutasi creative; invalidate daftar creative pada sukses. */
export function useAdCreativeMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['ad-creatives'] });

  return {
    create: useMutation({
      mutationFn: (vars: { slotId: string; payload: CreateAdCreativePayload }) =>
        adsApi.createCreative(vars.slotId, vars.payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateAdCreativePayload }) =>
        adsApi.updateCreative(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
  };
}
