/** admin/src/composables/useLiveStreams.ts — server-state kanal siaran langsung. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { liveStreamsApi } from '@/api/liveStreams';
import { settingsApi } from '@/api/settings';
import type {
  CreateLiveStreamPayload,
  UpdateLiveStreamPayload,
} from '@/types/cms';

/** Daftar kanal siaran (admin). */
export function useLiveStreamsQuery() {
  return useQuery({
    queryKey: ['live-streams'],
    queryFn: () => liveStreamsApi.listManage(),
  });
}

/** Mutasi kanal; invalidate daftar pada sukses. */
export function useLiveStreamMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['live-streams'] });

  return {
    create: useMutation({
      mutationFn: (payload: CreateLiveStreamPayload) =>
        liveStreamsApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateLiveStreamPayload }) =>
        liveStreamsApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    toggle: useMutation({
      mutationFn: (id: string) => liveStreamsApi.toggle(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => liveStreamsApi.remove(id),
      onSuccess: invalidate,
    }),
  };
}

/** Master saklar siaran (streaming_enabled): baca publik, tulis khusus ADMIN. */
export function useStreamingSwitch() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['streaming-enabled'],
    queryFn: async () => {
      const map = await settingsApi.publicMap();
      return map['streaming_enabled'] === true;
    },
  });
  const toggle = useMutation({
    mutationFn: (value: boolean) =>
      settingsApi.bulkUpdate({ streaming_enabled: value }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['streaming-enabled'] }),
  });
  return { query, toggle };
}
