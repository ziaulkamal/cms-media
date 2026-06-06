/** admin/src/api/venueContent.ts — endpoint pengayaan venue + proxy venue simpora. */
import type {
  SuccessEnvelope,
  UpsertVenueContentPayload,
  VenueContent,
  VenueSources,
} from '@/types/cms';
import { http, unwrap } from './http';

export const venueContentApi = {
  list: () =>
    unwrap<VenueContent[]>(
      http.get<SuccessEnvelope<VenueContent[]>>('/venue-content'),
    ),

  sources: () =>
    unwrap<VenueSources>(
      http.get<SuccessEnvelope<VenueSources>>('/venue-content/sources/venues'),
    ),

  upsert: (payload: UpsertVenueContentPayload) =>
    unwrap<VenueContent>(
      http.post<SuccessEnvelope<VenueContent>>('/venue-content', payload),
    ),

  remove: (ref: string) =>
    http.delete(`/venue-content/${encodeURIComponent(ref)}`),
};
