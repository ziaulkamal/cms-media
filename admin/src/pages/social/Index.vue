<!-- admin/src/pages/social/Index.vue — Tampilan Situs ▸ Sosial: daftar sosmed + penempatan ikon di footer. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { GripVertical, Plus, Trash2 } from 'lucide-vue-next';
import draggable from 'vuedraggable';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useMenusQuery } from '@/composables/useMenus';
import { useSettingMutations, useSettingsQuery } from '@/composables/useSettings';
import { useToast } from '@/composables/useToast';
import type { MenuLocation, SocialLink } from '@/types/cms';

const toast = useToast();
const { data, isLoading, error } = useSettingsQuery();
const { bulkUpdate } = useSettingMutations();

const footerLoc = ref<MenuLocation>('FOOTER');
const { data: footerMenu } = useMenusQuery(footerLoc);

const platformOptions = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
];

const urlPlaceholder: Record<string, string> = {
  whatsapp: 'https://wa.me/62…',
  telegram: 'https://t.me/…',
  email: 'mailto:info@…  atau  info@…',
  website: 'https://…',
};

/** Opsi penempatan: slot statis + tiap kolom footer (dinamis dari menu). */
const placementOptions = computed(() => {
  const cols = (footerMenu.value ?? []).map((c, i) => ({
    value: `column-${i + 1}`,
    label: `Kolom: ${c.label}`,
  }));
  return [
    { value: 'identity', label: 'Blok Identitas' },
    { value: 'secretariat', label: 'Blok Sekretariat' },
    ...cols,
    { value: 'bottom', label: 'Bawah footer' },
    { value: 'hidden', label: 'Sembunyikan' },
  ];
});

const links = ref<SocialLink[]>([]);
const placement = ref('secretariat');

watch(
  data,
  (list) => {
    if (!list) return;
    const s = list.find((x) => x.key === 'social_links');
    if (s && Array.isArray(s.value)) {
      links.value = (s.value as SocialLink[]).map((l) => ({ ...l }));
    }
    const p = list.find((x) => x.key === 'footer_social_placement');
    if (p && typeof p.value === 'string') placement.value = p.value;
  },
  { immediate: true },
);

function addLink(): void {
  links.value.push({ platform: 'facebook', url: '', enabled: true });
}
function removeLink(i: number): void {
  links.value.splice(i, 1);
}

async function onSave(): Promise<void> {
  try {
    await bulkUpdate.mutateAsync({
      social_links: links.value.map((l) => ({ ...l })),
      footer_social_placement: placement.value,
    });
    toast.success('Sosial media disimpan.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Sosial Media" subtitle="Tautan sosmed & penempatan ikonnya di footer.">
      <template #actions>
        <Button :loading="bulkUpdate.isPending.value" @click="onSave">Simpan</Button>
      </template>
    </PageHeader>

    <QueryState :loading="isLoading" :error="error" :is-empty="false">
      <div class="flex flex-col gap-4">
        <Card>
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-text-primary text-sm font-semibold">Daftar Tautan</h3>
              <p class="text-text-subtle text-xs">Seret untuk mengubah urutan tampil.</p>
            </div>
            <Button size="sm" variant="secondary" @click="addLink">
              <Plus class="h-4 w-4" /> Tambah
            </Button>
          </div>

          <draggable
            :list="links"
            item-key="__idx"
            handle=".drag-handle"
            :animation="160"
            class="flex flex-col gap-2"
          >
            <template #item="{ element: link, index }">
              <div class="border-border/60 bg-surface flex items-center gap-2 rounded-xl border p-2">
                <button
                  type="button"
                  class="drag-handle text-text-subtle hover:text-text-primary flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing"
                  aria-label="Seret"
                >
                  <GripVertical class="h-4 w-4" />
                </button>
                <div class="w-40 shrink-0">
                  <SelectInput v-model="link.platform" :options="platformOptions" />
                </div>
                <div class="min-w-0 flex-1">
                  <TextInput
                    v-model="link.url"
                    :placeholder="urlPlaceholder[link.platform] ?? 'https://…'"
                  />
                </div>
                <label class="text-text-muted flex shrink-0 items-center gap-1.5 text-xs">
                  <input v-model="link.enabled" type="checkbox" class="accent-primary size-4 rounded" />
                  Aktif
                </label>
                <button
                  type="button"
                  class="text-text-subtle hover:text-danger hover:bg-bg-subtle rounded-lg p-2"
                  aria-label="Hapus"
                  @click="removeLink(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </template>
          </draggable>

          <p v-if="!links.length" class="text-text-subtle py-4 text-center text-sm">
            Belum ada tautan. Klik "Tambah".
          </p>
        </Card>

        <Card>
          <h3 class="text-text-primary mb-1 text-sm font-semibold">Penempatan di Footer</h3>
          <p class="text-text-subtle mb-3 text-xs">
            Pilih di mana deretan ikon sosial ditampilkan. Kolom mengikuti menu footer.
          </p>
          <div class="max-w-xs">
            <SelectInput v-model="placement" :options="placementOptions" />
          </div>
        </Card>
      </div>
    </QueryState>
  </div>
</template>
