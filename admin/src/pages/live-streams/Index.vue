<!-- admin/src/pages/live-streams/Index.vue — kanal siaran: master switch, CRUD kanal, toggle tayang. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Pencil, Radio, Trash2, Tv, Users } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  useLiveStreamMutations,
  useLiveStreamsQuery,
  useStreamingSwitch,
} from '@/composables/useLiveStreams';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import type { LiveStream } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const auth = useAuthStore();
const isAdmin = computed(() => auth.role === 'ADMIN');

const { data, isLoading, error } = useLiveStreamsQuery();
const m = useLiveStreamMutations();
const streaming = useStreamingSwitch();

/** Thumbnail YouTube dari video id. */
const thumb = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

/** Toggle master saklar siaran (khusus ADMIN). */
async function onToggleMaster(): Promise<void> {
  try {
    await streaming.toggle.mutateAsync(!streaming.query.data.value);
    toast.success('Saklar siaran diperbarui.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengubah saklar.');
  }
}

async function onToggleLive(s: LiveStream): Promise<void> {
  try {
    await m.toggle.mutateAsync(s.id);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal toggle tayang.');
  }
}

// --- Form buat / ubah ---
const formOpen = ref(false);
const editId = ref<string | null>(null);
const form = reactive({
  youtube: '',
  title: '',
  sportName: '',
  venueName: '',
  sortOrder: '0',
});
const formError = ref('');

function openCreate(): void {
  editId.value = null;
  formError.value = '';
  Object.assign(form, { youtube: '', title: '', sportName: '', venueName: '', sortOrder: '0' });
  formOpen.value = true;
}

function openEdit(s: LiveStream): void {
  editId.value = s.id;
  formError.value = '';
  Object.assign(form, {
    youtube: s.youtubeId,
    title: s.title,
    sportName: s.sportName ?? '',
    venueName: s.venueName ?? '',
    sortOrder: String(s.sortOrder),
  });
  formOpen.value = true;
}

async function onSubmit(): Promise<void> {
  formError.value = '';
  const payload = {
    youtube: form.youtube.trim(),
    title: form.title.trim(),
    sportName: form.sportName || undefined,
    venueName: form.venueName || undefined,
    sortOrder: Number(form.sortOrder) || 0,
  };
  try {
    if (editId.value) {
      await m.update.mutateAsync({ id: editId.value, payload });
    } else {
      await m.create.mutateAsync(payload);
    }
    formOpen.value = false;
    toast.success('Kanal disimpan.');
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : 'Gagal menyimpan kanal.';
  }
}

async function onRemove(s: LiveStream): Promise<void> {
  const ok = await confirm({
    title: 'Hapus kanal',
    message: `Kanal "${s.title}" akan dihapus.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.remove.mutateAsync(s.id);
    toast.success('Kanal dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Live Streaming" subtitle="Kelola kanal siaran langsung YouTube.">
      <template #actions>
        <Button @click="openCreate">Tambah Kanal</Button>
      </template>
    </PageHeader>

    <!-- Master switch siaran -->
    <Card class="mb-5">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span
            :class="streaming.query.data.value ? 'text-success bg-success-light' : 'text-text-muted bg-bg-subtle'"
            class="flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <Radio class="h-5 w-5" />
          </span>
          <div>
            <p class="text-text-primary text-sm font-semibold">Master Siaran</p>
            <p class="text-text-muted text-xs">
              Saklar global menampilkan blok siaran di situs publik.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Badge :variant="streaming.query.data.value ? 'success' : 'neutral'">
            {{ streaming.query.data.value ? 'Aktif' : 'Nonaktif' }}
          </Badge>
          <Button
            v-if="isAdmin"
            variant="secondary"
            size="sm"
            :loading="streaming.toggle.isPending.value"
            @click="onToggleMaster"
          >
            {{ streaming.query.data.value ? 'Matikan' : 'Aktifkan' }}
          </Button>
        </div>
      </div>
    </Card>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.length === 0"
      empty-text="Belum ada kanal siaran."
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="s in data!"
          :key="s.id"
          class="bg-surface border-border overflow-hidden rounded-xl border shadow-sm"
        >
          <div class="relative">
            <img :src="thumb(s.youtubeId)" :alt="s.title" class="aspect-video w-full object-cover" />
            <Badge
              v-if="s.isLive"
              variant="danger"
              class="absolute left-2 top-2 !bg-danger !text-white"
            >
              <Tv class="h-3 w-3" /> LIVE
            </Badge>
          </div>
          <div class="p-4">
            <p class="text-text-primary truncate text-sm font-semibold">{{ s.title }}</p>
            <p class="text-text-muted mt-0.5 truncate text-xs">
              {{ s.sportName || 'Umum' }}<span v-if="s.venueName"> · {{ s.venueName }}</span>
            </p>
            <p class="text-text-subtle mt-1 flex items-center gap-1 text-xs">
              <Users class="h-3 w-3" />{{ s.viewerCount }} penonton
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                :variant="s.isLive ? 'secondary' : 'primary'"
                :loading="m.toggle.isPending.value"
                @click="onToggleLive(s)"
              >
                {{ s.isLive ? 'Hentikan' : 'Tayangkan' }}
              </Button>
              <Button size="sm" variant="ghost" @click="openEdit(s)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" @click="onRemove(s)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </QueryState>

    <!-- Form kanal -->
    <Modal v-model:open="formOpen" :title="editId ? 'Ubah Kanal' : 'Tambah Kanal'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <TextInput
          v-model="form.youtube"
          label="URL / ID YouTube"
          placeholder="https://youtu.be/… atau ID"
          required
          :error="formError"
        />
        <TextInput v-model="form.title" label="Judul" required />
        <TextInput v-model="form.sportName" label="Cabang Olahraga" placeholder="mis. Sepakbola" />
        <TextInput v-model="form.venueName" label="Venue" placeholder="mis. Stadion Calang" />
        <TextInput v-model="form.sortOrder" label="Urutan" type="number" />
      </form>
      <template #footer>
        <Button variant="secondary" @click="formOpen = false">Batal</Button>
        <Button
          :loading="m.create.isPending.value || m.update.isPending.value"
          @click="onSubmit"
        >
          Simpan
        </Button>
      </template>
    </Modal>
  </div>
</template>
