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

/** Opsi pertandingan (ongoing+scheduled) dari CORE untuk penaut kanal. */
export function useMatchOptionsQuery() {
  return useQuery({
    queryKey: ['live-stream-match-options'],
    queryFn: () => liveStreamsApi.matchOptions(),
    staleTime: 30_000,
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
    toggleFeature: useMutation({
      mutationFn: (id: string) => liveStreamsApi.toggleFeature(id),
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
    // GET admin sudah no-cache global (lihat api/http.ts) → nilai selalu terkini.
    queryFn: async () => {
      const map = await settingsApi.publicMap();
      return map['streaming_enabled'] === true;
    },
  });
  const toggle = useMutation({
    mutationFn: (value: boolean) =>
      settingsApi.bulkUpdate({ streaming_enabled: value }),
    // Optimistic: switch langsung berubah; rollback bila gagal (cegah "macet").
    onMutate: async (value: boolean) => {
      await qc.cancelQueries({ queryKey: ['streaming-enabled'] });
      const prev = qc.getQueryData<boolean>(['streaming-enabled']);
      qc.setQueryData(['streaming-enabled'], value);
      return { prev };
    },
    onError: (_e, _value, ctx) => {
      if (ctx) qc.setQueryData(['streaming-enabled'], ctx.prev);
    },
    onSettled: () =>
      void qc.invalidateQueries({ queryKey: ['streaming-enabled'] }),
  });
  return { query, toggle };
}
