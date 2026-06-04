/** admin/src/api/ads.ts — endpoint slot & creative iklan (editor ke atas). */
import type {
  AdCreative,
  AdSlot,
  CreateAdCreativePayload,
  CreateAdSlotPayload,
  SuccessEnvelope,
  UpdateAdCreativePayload,
  UpdateAdSlotPayload,
} from '@/types/cms';
import { http, unwrap } from './http';

export const adsApi = {
  listSlots: () =>
    unwrap<AdSlot[]>(http.get<SuccessEnvelope<AdSlot[]>>('/ads/slots')),

  createSlot: (payload: CreateAdSlotPayload) =>
    unwrap<AdSlot>(http.post<SuccessEnvelope<AdSlot>>('/ads/slots', payload)),

  updateSlot: (id: string, payload: UpdateAdSlotPayload) =>
    unwrap<AdSlot>(
      http.patch<SuccessEnvelope<AdSlot>>(`/ads/slots/${id}`, payload),
    ),

  listCreatives: (slotId: string) =>
    unwrap<AdCreative[]>(
      http.get<SuccessEnvelope<AdCreative[]>>(`/ads/slots/${slotId}/creatives`),
    ),

  createCreative: (slotId: string, payload: CreateAdCreativePayload) =>
    unwrap<AdCreative>(
      http.post<SuccessEnvelope<AdCreative>>(
        `/ads/slots/${slotId}/creatives`,
        payload,
      ),
    ),

  updateCreative: (id: string, payload: UpdateAdCreativePayload) =>
    unwrap<AdCreative>(
      http.patch<SuccessEnvelope<AdCreative>>(`/ads/creatives/${id}`, payload),
    ),
};
