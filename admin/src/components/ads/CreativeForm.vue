<!-- admin/src/components/ads/CreativeForm.vue — form creative; field wajib berbeda per kind. -->
<script setup lang="ts">
import dayjs from 'dayjs';
import { reactive, watch } from 'vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import Textarea from '@/components/ui/Textarea.vue';
import {
  adKindLabel,
  adPlatformLabel,
  adStatusLabel,
  toOptions,
} from '@/lib/labels';
import type { AdCreative, CreateAdCreativePayload } from '@/types/cms';

const props = defineProps<{ initial?: AdCreative | null }>();
const emit = defineEmits<{ submit: [payload: CreateAdCreativePayload] }>();

const form = reactive({
  kind: 'HOUSE_IMAGE' as string,
  platform: 'WEB' as string,
  status: 'DRAFT' as string,
  name: '',
  imageUrl: '',
  targetUrl: '',
  alt: '',
  htmlSnippet: '',
  adClient: '',
  adSlot: '',
  adFormat: '',
  width: '',
  height: '',
  priority: '0',
  startAt: '',
  endAt: '',
});

/** ISO -> nilai datetime-local ("YYYY-MM-DDTHH:mm"). */
function toLocal(iso: string | null): string {
  return iso ? dayjs(iso).format('YYYY-MM-DDTHH:mm') : '';
}

// Isi form saat edit (initial berubah).
watch(
  () => props.initial,
  (c) => {
    if (!c) return;
    Object.assign(form, {
      kind: c.kind,
      platform: c.platform,
      status: c.status,
      name: c.name,
      imageUrl: c.imageUrl ?? '',
      targetUrl: c.targetUrl ?? '',
      alt: c.alt ?? '',
      htmlSnippet: c.htmlSnippet ?? '',
      adClient: c.adClient ?? '',
      adSlot: c.adSlot ?? '',
      adFormat: c.adFormat ?? '',
      width: c.width?.toString() ?? '',
      height: c.height?.toString() ?? '',
      priority: c.priority.toString(),
      startAt: toLocal(c.startAt),
      endAt: toLocal(c.endAt),
    });
  },
  { immediate: true },
);

/** Rakit payload sesuai kind aktif; sertakan hanya field relevan. */
function submit(): void {
  const payload: CreateAdCreativePayload = {
    kind: form.kind as CreateAdCreativePayload['kind'],
    platform: form.platform as CreateAdCreativePayload['platform'],
    status: form.status as CreateAdCreativePayload['status'],
    name: form.name,
    width: form.width ? Number(form.width) : undefined,
    height: form.height ? Number(form.height) : undefined,
    priority: form.priority ? Number(form.priority) : undefined,
    startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
    endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    alt: form.alt || undefined,
  };
  if (form.kind === 'HOUSE_IMAGE') {
    payload.imageUrl = form.imageUrl || undefined;
    payload.targetUrl = form.targetUrl || undefined;
  } else if (form.kind === 'HOUSE_HTML') {
    payload.htmlSnippet = form.htmlSnippet || undefined;
  } else if (form.kind === 'ADSENSE') {
    payload.adClient = form.adClient || undefined;
    payload.adSlot = form.adSlot || undefined;
    payload.adFormat = form.adFormat || undefined;
  }
  emit('submit', payload);
}

defineExpose({ submit });
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <TextInput v-model="form.name" label="Nama creative" required />

    <div class="grid grid-cols-3 gap-3">
      <SelectInput
        v-model="form.kind"
        label="Jenis"
        :allow-empty="false"
        :options="toOptions(adKindLabel)"
      />
      <SelectInput
        v-model="form.platform"
        label="Platform"
        :allow-empty="false"
        :options="toOptions(adPlatformLabel)"
      />
      <SelectInput
        v-model="form.status"
        label="Status"
        :allow-empty="false"
        :options="toOptions(adStatusLabel)"
      />
    </div>

    <!-- Field kondisional per kind -->
    <template v-if="form.kind === 'HOUSE_IMAGE'">
      <TextInput v-model="form.imageUrl" label="URL Gambar" placeholder="https://…" />
      <TextInput v-model="form.targetUrl" label="URL Tujuan" placeholder="https://…" />
      <TextInput v-model="form.alt" label="Alt" />
    </template>

    <template v-else-if="form.kind === 'HOUSE_HTML'">
      <Textarea v-model="form.htmlSnippet" label="HTML Snippet" :rows="5" />
    </template>

    <template v-else-if="form.kind === 'ADSENSE'">
      <TextInput v-model="form.adClient" label="Ad Client" placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
      <TextInput v-model="form.adSlot" label="Ad Slot" placeholder="1234567890" />
      <TextInput v-model="form.adFormat" label="Ad Format" placeholder="auto" />
    </template>

    <div class="grid grid-cols-3 gap-3">
      <TextInput v-model="form.priority" label="Prioritas" type="number" />
      <TextInput v-model="form.width" label="Lebar (px)" type="number" />
      <TextInput v-model="form.height" label="Tinggi (px)" type="number" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <label class="text-text-primary text-sm font-medium">Mulai</label>
        <input
          v-model="form.startAt"
          type="datetime-local"
          class="border-border bg-surface text-text-primary h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-text-primary text-sm font-medium">Selesai</label>
        <input
          v-model="form.endAt"
          type="datetime-local"
          class="border-border bg-surface text-text-primary h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  </form>
</template>
