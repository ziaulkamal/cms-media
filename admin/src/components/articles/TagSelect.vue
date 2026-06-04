<!-- admin/src/components/articles/TagSelect.vue — pilih banyak tag (chip toggle) + buat cepat. -->
<script setup lang="ts">
import { ref } from 'vue';
import { Hash } from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import { useToast } from '@/composables/useToast';
import { useTagMutations, useTagsQuery } from '@/composables/useTags';
import { ApiError } from '@/api/http';

const selected = defineModel<string[]>({ default: () => [] });

const { data: tags, isLoading } = useTagsQuery();
const { create } = useTagMutations();
const toast = useToast();
const newTag = ref('');

/** Toggle keanggotaan sebuah tag pada daftar terpilih. */
function toggle(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((t) => t !== id)
    : [...selected.value, id];
}

/** Buat tag dari input; teks dipecah koma → tiap bagian jadi satu tag, lalu langsung dipilih. */
async function onCreate(): Promise<void> {
  const names = [...new Set(newTag.value.split(',').map((n) => n.trim()).filter(Boolean))];
  if (names.length === 0) return;
  newTag.value = '';
  try {
    for (const name of names) {
      const tag = await create.mutateAsync({ name });
      if (!selected.value.includes(tag.id)) selected.value = [...selected.value, tag.id];
    }
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal membuat tag.');
  }
}
</script>

<template>
  <Card title="Tag" :icon="Hash">
    <div class="flex flex-col gap-3">
      <p v-if="isLoading" class="text-text-muted text-sm">Memuat tag…</p>
      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in tags ?? []"
          :key="tag.id"
          type="button"
          class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            selected.includes(tag.id)
              ? 'bg-primary text-white'
              : 'bg-bg-subtle text-text-muted hover:bg-border'
          "
          @click="toggle(tag.id)"
        >
          {{ tag.name }}
        </button>
        <span v-if="(tags ?? []).length === 0" class="text-text-subtle text-sm">
          Belum ada tag.
        </span>
      </div>

      <form class="flex gap-2" @submit.prevent="onCreate">
        <input
          v-model="newTag"
          placeholder="Tag baru… (pisahkan dengan koma)"
          class="border-border bg-surface text-text-primary h-9 flex-1 rounded-md border px-2 text-sm outline-none focus:border-primary"
          @keydown="(e) => e.key === ',' && (e.preventDefault(), onCreate())"
        />
        <Button type="submit" size="sm" variant="secondary" :loading="create.isPending.value">
          Tambah
        </Button>
      </form>
    </div>
  </Card>
</template>
