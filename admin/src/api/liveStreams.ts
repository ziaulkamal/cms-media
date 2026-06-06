/** admin/src/api/liveStreams.ts — endpoint kanal siaran langsung (staf editorial). */
import type {
  CreateLiveStreamPayload,
  LiveStream,
  MatchOption,
  SuccessEnvelope,
  UpdateLiveStreamPayload,
} from '@/types/cms';
import { http, unwrap } from './http';

export const liveStreamsApi = {
  listManage: () =>
    unwrap<LiveStream[]>(
      http.get<SuccessEnvelope<LiveStream[]>>('/live-streams/manage'),
    ),

  matchOptions: () =>
    unwrap<MatchOption[]>(
      http.get<SuccessEnvelope<MatchOption[]>>('/live-streams/match-options'),
    ),

  create: (payload: CreateLiveStreamPayload) =>
    unwrap<LiveStream>(
      http.post<SuccessEnvelope<LiveStream>>('/live-streams', payload),
    ),

  update: (id: string, payload: UpdateLiveStreamPayload) =>
    unwrap<LiveStream>(
      http.put<SuccessEnvelope<LiveStream>>(`/live-streams/${id}`, payload),
    ),

  toggle: (id: string) =>
    unwrap<LiveStream>(
      http.patch<SuccessEnvelope<LiveStream>>(`/live-streams/${id}/toggle`),
    ),

  toggleFeature: (id: string) =>
    unwrap<LiveStream>(
      http.patch<SuccessEnvelope<LiveStream>>(`/live-streams/${id}/feature`),
    ),

  remove: (id: string) => http.delete(`/live-streams/${id}`),
};
