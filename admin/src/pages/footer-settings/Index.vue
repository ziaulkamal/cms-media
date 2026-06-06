<!-- admin/src/pages/footer-settings/Index.vue — Tampilan Situs ▸ Footer: deskripsi, sekretariat, & layout kolom. -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import Textarea from '@/components/ui/Textarea.vue';
import { useMenusQuery } from '@/composables/useMenus';
import { useSettingMutations, useSettingsQuery } from '@/composables/useSettings';
import { useToast } from '@/composables/useToast';
import type { MenuLocation } from '@/types/cms';

const toast = useToast();
const { data, isLoading, error } = useSettingsQuery();
const { bulkUpdate } = useSettingMutations();

// Hitung jumlah kolom footer aktual (dari menu) untuk preview yang akurat.
const footerLoc = ref<MenuLocation>('FOOTER');
const { data: footerMenu } = useMenusQuery(footerLoc);
const navCount = computed(() => footerMenu.value?.length || 2);

interface FooterLayout {
  preset: string;
  gap: string;
  identityWeight: number;
  navWeight: number;
  contactWeight: number;
  showIdentity: boolean;
  showContact: boolean;
  gridTemplate: string;
}

const DEFAULT_LAYOUT: FooterLayout = {
  preset: 'balanced',
  gap: 'md',
  identityWeight: 1.5,
  navWeight: 1,
  contactWeight: 1.3,
  showIdentity: true,
  showContact: true,
  gridTemplate: '',
};

const PRESETS: Record<string, Partial<FooterLayout>> = {
  balanced: { identityWeight: 1.5, navWeight: 1, contactWeight: 1.3, gap: 'md' },
  'left-wide': { identityWeight: 2.4, navWeight: 1, contactWeight: 1, gap: 'md' },
  'right-wide': { identityWeight: 1, navWeight: 1, contactWeight: 2.4, gap: 'md' },
  compact: { identityWeight: 1.2, navWeight: 1, contactWeight: 1.2, gap: 'sm' },
};
const presetLabels: Record<string, string> = {
  balanced: 'Seimbang',
  'left-wide': 'Kiri lebar',
  'right-wide': 'Kanan lebar',
  compact: 'Kompak',
};

const text = reactive<Record<string, string>>({
  footer_description: '',
  footer_secretariat_title: '',
  contact_address: '',
  contact_phone: '',
  contact_email: '',
});
const layout = reactive<FooterLayout>({ ...DEFAULT_LAYOUT });
const advanced = ref(false);

watch(
  data,
  (list) => {
    if (!list) return;
    for (const key of Object.keys(text)) {
      const s = list.find((x) => x.key === key);
      if (s) text[key] = (s.value ?? '') as string;
    }
    const l = list.find((x) => x.key === 'footer_layout');
    if (l && l.value && typeof l.value === 'object') {
      Object.assign(layout, DEFAULT_LAYOUT, l.value as Partial<FooterLayout>);
      if (layout.gridTemplate || layout.preset === 'custom') advanced.value = true;
    }
  },
  { immediate: true },
);

const gapOptions = [
  { value: 'sm', label: 'Rapat' },
  { value: 'md', label: 'Sedang' },
  { value: 'lg', label: 'Lebar' },
  { value: 'xl', label: 'Sangat lebar' },
];
const gapPx: Record<string, number> = { sm: 16, md: 32, lg: 48, xl: 72 };

/** Slot footer (identitas + kolom nav + sekretariat) untuk preview. */
const slots = computed(() => {
  const arr: { label: string; w: number; tone: string }[] = [];
  if (layout.showIdentity)
    arr.push({ label: 'Identitas', w: Number(layout.identityWeight) || 1, tone: 'bg-primary/70' });
  for (let i = 0; i < navCount.value; i++)
    arr.push({ label: `Kolom ${i + 1}`, w: Number(layout.navWeight) || 1, tone: 'bg-text-subtle/40' });
  if (layout.showContact)
    arr.push({ label: 'Sekretariat', w: Number(layout.contactWeight) || 1, tone: 'bg-primary/40' });
  return arr;
});
const computedTemplate = computed(() => slots.value.map((s) => `${s.w}fr`).join(' '));
const effectiveTemplate = computed(() => layout.gridTemplate.trim() || computedTemplate.value);

function applyPreset(name: string): void {
  Object.assign(layout, PRESETS[name], { preset: name, gridTemplate: '' });
  advanced.value = false;
}
function markCustom(): void {
  layout.preset = 'custom';
}

async function onSave(): Promise<void> {
  try {
    await bulkUpdate.mutateAsync({ ...text, footer_layout: { ...layout } });
    toast.success('Pengaturan footer disimpan.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Footer" subtitle="Deskripsi, sekretariat, dan layout kolom footer.">
      <template #actions>
        <Button :loading="bulkUpdate.isPending.value" @click="onSave">Simpan</Button>
      </template>
    </PageHeader>

    <QueryState :loading="isLoading" :error="error" :is-empty="false">
      <div class="flex flex-col gap-4">
        <!-- Identitas -->
        <Card>
          <h3 class="text-text-primary mb-3 text-sm font-semibold">Identitas Footer</h3>
          <Textarea
            v-model="text.footer_description"
            label="Deskripsi singkat"
            :rows="3"
            placeholder="Kosongkan untuk teks bawaan dari identitas event."
          />
        </Card>

        <!-- Sekretariat -->
        <Card>
          <h3 class="text-text-primary mb-3 text-sm font-semibold">Sekretariat Panitia</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <TextInput v-model="text.footer_secretariat_title" label="Judul" placeholder="Sekretariat Panitia" />
            <TextInput v-model="text.contact_address" label="Alamat" />
            <TextInput v-model="text.contact_phone" label="Telepon" placeholder="(0654) 000-1234" />
            <TextInput v-model="text.contact_email" label="Email" placeholder="info@pora-acehjaya.id" />
          </div>
        </Card>

        <!-- Layout kolom -->
        <Card>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-text-primary text-sm font-semibold">Layout Kolom</h3>
            <label class="text-text-muted flex items-center gap-2 text-xs">
              <input v-model="advanced" type="checkbox" class="accent-primary size-4 rounded" />
              Mode lanjutan
            </label>
          </div>

          <!-- Preset cepat -->
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="(lbl, key) in presetLabels"
              :key="key"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
              :class="layout.preset === key
                ? 'border-primary bg-primary text-white'
                : 'border-border text-text-muted hover:text-text-primary'"
              @click="applyPreset(key)"
            >
              {{ lbl }}
            </button>
          </div>

          <!-- Lanjutan: gap, bobot, toggle, override -->
          <div v-if="advanced" class="border-border mb-4 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
            <SelectInput v-model="layout.gap" label="Jarak antar kolom (gap)" :options="gapOptions" @update:model-value="markCustom" />
            <div class="flex items-end gap-4">
              <label class="text-text-muted flex items-center gap-2 text-sm">
                <input v-model="layout.showIdentity" type="checkbox" class="accent-primary size-4 rounded" @change="markCustom" />
                Tampilkan Identitas
              </label>
              <label class="text-text-muted flex items-center gap-2 text-sm">
                <input v-model="layout.showContact" type="checkbox" class="accent-primary size-4 rounded" @change="markCustom" />
                Tampilkan Sekretariat
              </label>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-text-primary text-sm font-medium">Bobot Identitas (fr)</label>
              <input
                type="number" step="0.1" min="0" :value="layout.identityWeight"
                class="border-border bg-surface text-text-primary h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
                @input="layout.identityWeight = Number(($event.target as HTMLInputElement).value); markCustom()"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-text-primary text-sm font-medium">Bobot tiap Kolom nav (fr)</label>
              <input
                type="number" step="0.1" min="0" :value="layout.navWeight"
                class="border-border bg-surface text-text-primary h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
                @input="layout.navWeight = Number(($event.target as HTMLInputElement).value); markCustom()"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-text-primary text-sm font-medium">Bobot Sekretariat (fr)</label>
              <input
                type="number" step="0.1" min="0" :value="layout.contactWeight"
                class="border-border bg-surface text-text-primary h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
                @input="layout.contactWeight = Number(($event.target as HTMLInputElement).value); markCustom()"
              />
            </div>
            <TextInput
              v-model="layout.gridTemplate"
              label="Override grid-template-columns (opsional)"
              placeholder="mis. 1.5fr 1fr 1fr 1.3fr"
              @update:model-value="markCustom"
            />
          </div>

          <!-- Preview -->
          <p class="text-text-subtle mb-2 text-xs">
            Pratinjau ({{ navCount }} kolom nav dari menu footer) — gap {{ layout.gap }}:
          </p>
          <div
            class="border-border bg-bg-subtle grid rounded-xl border p-3"
            :style="{ gridTemplateColumns: effectiveTemplate, gap: `${gapPx[layout.gap] ?? 32}px` }"
          >
            <div
              v-for="(s, i) in slots"
              :key="i"
              class="flex h-14 items-center justify-center rounded-lg text-center text-[11px] font-medium text-white"
              :class="s.tone"
            >
              {{ s.label }}
            </div>
          </div>
          <p class="text-text-subtle mt-2 font-mono text-[11px]">grid-template-columns: {{ effectiveTemplate }}</p>
        </Card>
      </div>
    </QueryState>
  </div>
</template>
