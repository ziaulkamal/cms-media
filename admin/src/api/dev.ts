/** admin/src/api/dev.ts — endpoint tools developer: generator & pembersih data dummy. */
import type {
  DummyCounts,
  GenerateDummyPayload,
  SuccessEnvelope,
} from '@/types/cms';
import { http, unwrap } from './http';

export const devApi = {
  stats: () =>
    unwrap<DummyCounts>(http.get<SuccessEnvelope<DummyCounts>>('/dev/dummy-stats')),

  generate: (payload: GenerateDummyPayload) =>
    unwrap<DummyCounts>(
      http.post<SuccessEnvelope<DummyCounts>>('/dev/seed-dummy', payload),
    ),

  clear: () =>
    unwrap<DummyCounts>(http.post<SuccessEnvelope<DummyCounts>>('/dev/clear-dummy')),
};
