<!-- admin/src/pages/settings/Index.vue — pengaturan situs: tab per group, edit nilai (bulk), tambah/hapus key. -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import SettingField from '@/components/settings/SettingField.vue';
import SettingsGuide from '@/components/settings/SettingsGuide.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useSettingMutations, useSettingsQuery } from '@/composables/useSettings';
import { useToast } from '@/composables/useToast';
import { settingTypeLabel, toOptions } from '@/lib/labels';
import type { Setting } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { data, isLoading, error } = useSettingsQuery();
const { bulkUpdate, upsert, remove } = useSettingMutations();

// Salinan nilai yang dapat diedit (key -> value).
const values = reactive<Record<string, unknown>>({});
const activeGroup = ref('');

watch(
  () => data.value,
  (list) => {
    if (!list) return;
    for (const s of list) values[s.key] = s.value;
    if (!activeGroup.value && list.length) activeGroup.value = list[0].group;
  },
  { immediate: true },
);

/** Daftar group unik (untuk tab). */
const groups = computed(() => [...new Set((data.value ?? []).map((s) => s.group))]);

/** Setting pada group yang sedang aktif. */
const groupSettings = computed(() =>
  (data.value ?? []).filter((s) => s.group === activeGroup.value),
);

/** Simpan seluruh nilai yang diedit (PATCH /settings). */
async function onSave(): Promise<void> {
  try {
    const result = await bulkUpdate.mutateAsync({ ...values });
    toast.success(`${result.updated} setting diperbarui.`);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan setting.');
  }
}

/** Hapus setting (key dinamis) setelah konfirmasi. */
async function onRemove(key: string): Promise<void> {
  const ok = await confirm({
    title: 'Hapus setting',
    message: `Setting "${key}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(key);
    delete values[key];
    toast.success('Setting dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

// --- Tambah setting baru ---
const addOpen = ref(false);
const addError = ref('');
const newSetting = reactive({
  key: '',
  type: 'STRING' as string,
  group: 'general',
  label: '',
  isPublic: false,
});

function openAdd(): void {
  addError.value = '';
  Object.assign(newSetting, { key: '', type: 'STRING', group: 'general', label: '', isPublic: false });
  addOpen.value = true;
}

/** Buat setting baru via upsert. */
async function onAdd(): Promise<void> {
  addError.value = '';
  try {
    await upsert.mutateAsync({
      key: newSetting.key,
      payload: {
        type: newSetting.type as Setting['type'],
        group: newSetting.group || 'general',
        label: newSetting.label || undefined,
        isPublic: newSetting.isPublic,
        value: '',
      },
    });
    activeGroup.value = newSetting.group || 'general';
    addOpen.value = false;
    toast.success('Setting ditambahkan.');
  } catch (e) {
    addError.value = e instanceof ApiError ? e.message : 'Gagal menambah setting.';
  }
}
</script>

<template>
  <div>
    <PageHeader title="Pengaturan" subtitle="Konfigurasi situs dinamis.">
      <template #actions>
        <Button variant="secondary" @click="openAdd">Tambah Setting</Button>
        <Button :loading="bulkUpdate.isPending.value" @click="onSave">Simpan Perubahan</Button>
      </template>
    </PageHeader>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.length === 0"
      empty-text="Belum ada setting. Tambahkan yang pertama."
    >
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Kolom kiri: editor setting -->
        <div class="lg:col-span-2">
          <div class="bg-bg-subtle mb-4 inline-flex flex-wrap gap-1 rounded-xl p-1">
            <button
              v-for="g in groups"
              :key="g"
              type="button"
              class="rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors"
              :class="
                activeGroup === g
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              "
              @click="activeGroup = g"
            >
              {{ g }}
            </button>
          </div>

          <Card>
            <div class="flex flex-col gap-5">
              <div
                v-for="s in groupSettings"
                :key="s.key"
                class="border-border flex items-start gap-3 border-b pb-5 last:border-0 last:pb-0"
              >
                <div class="flex-1">
                  <SettingField
                    v-model="values[s.key]"
                    :type="s.type"
                    :label="s.label || s.key"
                  />
                  <p class="text-text-subtle mt-1 flex items-center gap-1.5 text-xs">
                    <code>{{ s.key }}</code>
                    <span>· {{ settingTypeLabel[s.type] }}</span>
                    <Badge v-if="s.isPublic" variant="info">publik</Badge>
                  </p>
                </div>
                <button
                  type="button"
                  class="text-text-subtle hover:text-danger mt-1"
                  aria-label="Hapus setting"
                  @click="onRemove(s.key)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        <!-- Kolom kanan: panduan accordion (sticky) -->
        <aside class="lg:col-span-1">
          <div class="lg:sticky lg:top-6">
            <SettingsGuide />
          </div>
        </aside>
      </div>
    </QueryState>

    <Modal v-model:open="addOpen" title="Tambah Setting">
      <form class="flex flex-col gap-4" @submit.prevent="onAdd">
        <TextInput v-model="newSetting.key" label="Key" placeholder="site_title" required :error="addError" />
        <SelectInput
          v-model="newSetting.type"
          label="Tipe"
          :allow-empty="false"
          :options="toOptions(settingTypeLabel)"
        />
        <TextInput v-model="newSetting.group" label="Group" placeholder="general" />
        <TextInput v-model="newSetting.label" label="Label" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="newSetting.isPublic" type="checkbox" class="accent-primary" />
          Boleh dibaca publik (SEO/meta)
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="addOpen = false">Batal</Button>
        <Button :loading="upsert.isPending.value" @click="onAdd">Tambah</Button>
      </template>
    </Modal>
  </div>
</template>
