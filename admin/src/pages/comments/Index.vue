<!-- admin/src/pages/comments/Index.vue — moderasi komentar (tabel): isi, waktu, nama, email, target; approve/spam/delete. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  CheckCircle2,
  Clock3,
  CornerDownRight,
  MessagesSquare,
  Reply,
  ShieldAlert,
  Trash2,
} from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Badge from '@/components/ui/Badge.vue';
import BulkActionBar from '@/components/ui/BulkActionBar.vue';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import Textarea from '@/components/ui/Textarea.vue';
import {
  useCommentMutations,
  useCommentsQuery,
  useCommentStatsQuery,
} from '@/composables/useComments';
import { useConfirm } from '@/composables/useConfirm';
import { useQueryParam } from '@/composables/useFilters';
import { usePagination } from '@/composables/usePagination';
import { useSelection } from '@/composables/useSelection';
import { useToast } from '@/composables/useToast';
import { commentStatusLabel, commentStatusVariant, toOptions } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';
import type {
  CommentModeration,
  CommentModerationStats,
  ModerationQuery,
} from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const auth = useAuthStore();
/** Approve/spam/hapus hanya untuk editor ke atas; balas terbuka semua role. */
const canModerate = computed(() => auth.hasRole('ADMIN', 'EDITOR'));
const status = useQueryParam('status');
const { page, perPage } = usePagination(20);

const params = computed<ModerationQuery>(() => ({
  page: page.value,
  perPage: perPage.value,
  status: (status.value || undefined) as ModerationQuery['status'],
}));

const { data, isLoading, error } = useCommentsQuery(params);
const { data: stats } = useCommentStatsQuery();
const { approve, spam, remove, bulkRemove, reply } = useCommentMutations();
const statusOptions = toOptions(commentStatusLabel);

const busy = computed(
  () =>
    approve.isPending.value ||
    spam.isPending.value ||
    remove.isPending.value ||
    bulkRemove.isPending.value,
);

// Seleksi baris untuk hapus massal.
const sel = useSelection();
const pageIds = computed(() => (data.value?.items ?? []).map((c) => c.id));
function toggleAll(on: boolean): void {
  sel.setMany(pageIds.value, on);
}
async function onBulkDelete(): Promise<void> {
  const ok = await confirm({
    title: 'Hapus komentar terpilih',
    message: `${sel.count.value} komentar akan dihapus permanen beserta balasannya.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  await run(bulkRemove.mutateAsync(sel.ids.value), 'Komentar terpilih dihapus.');
  sel.clear();
}

/** Kartu ringkasan jumlah komentar per status. */
const summary = computed(() => {
  const s: CommentModerationStats = stats.value ?? {
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
  };
  return [
    { key: 'total', label: 'Total', value: s.total, icon: MessagesSquare, tone: 'text-primary bg-primary-light' },
    { key: 'pending', label: 'Menunggu', value: s.pending, icon: Clock3, tone: 'text-warning bg-warning-light' },
    { key: 'approved', label: 'Disetujui', value: s.approved, icon: CheckCircle2, tone: 'text-success bg-success-light' },
    { key: 'spam', label: 'Spam', value: s.spam, icon: ShieldAlert, tone: 'text-danger bg-danger-light' },
  ];
});

// --- Isi komentar: pendek tampil penuh; panjang dipotong + "lihat semua". ---
const LIMIT = 140;
const expanded = ref<Set<string>>(new Set());
const isLong = (body: string) => body.length > LIMIT;
function previewBody(c: CommentModeration): string {
  if (expanded.value.has(c.id) || !isLong(c.body)) return c.body;
  return c.body.slice(0, LIMIT).trimEnd() + '…';
}
function toggleExpand(id: string): void {
  const next = new Set(expanded.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expanded.value = next;
}

/** Bungkus aksi moderasi dengan toast. */
async function run(action: Promise<unknown>, ok: string): Promise<void> {
  try {
    await action;
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Aksi gagal.');
  }
}

// --- Balas komentar sebagai panitia ---
const replyOpen = ref(false);
const replyTarget = ref<CommentModeration | null>(null);
const replyBody = ref('');
const replyError = ref('');

/** Buka modal balas untuk komentar terpilih. */
function openReply(c: CommentModeration): void {
  replyTarget.value = c;
  replyBody.value = '';
  replyError.value = '';
  replyOpen.value = true;
}

/** Kirim balasan; balasan langsung tampil & ditandai panitia. */
async function onReply(): Promise<void> {
  if (!replyTarget.value) return;
  replyError.value = '';
  if (replyBody.value.trim().length < 2) {
    replyError.value = 'Balasan minimal 2 karakter.';
    return;
  }
  try {
    await reply.mutateAsync({ id: replyTarget.value.id, body: replyBody.value.trim() });
    replyOpen.value = false;
    toast.success('Balasan terkirim.');
  } catch (e) {
    replyError.value = e instanceof ApiError ? e.message : 'Gagal mengirim balasan.';
  }
}

/** Hapus komentar dengan konfirmasi (balasan ikut terhapus). */
async function onDelete(c: CommentModeration): Promise<void> {
  const ok = await confirm({
    title: 'Hapus komentar',
    message: `Komentar dari "${c.authorName || 'Anonim'}" akan dihapus permanen beserta balasannya.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  await run(remove.mutateAsync(c.id), 'Komentar dihapus.');
}
</script>

<template>
  <div>
    <PageHeader title="Komentar" subtitle="Antrean moderasi komentar pembaca." />

    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="item in summary"
        :key="item.key"
        class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
      >
        <span :class="item.tone" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <component :is="item.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-text-primary text-xl font-semibold leading-none">{{ item.value }}</p>
          <p class="text-text-muted mt-1 text-xs">{{ item.label }}</p>
        </div>
      </div>
    </div>

    <div class="mb-4 max-w-xs">
      <SelectInput v-model="status" :options="statusOptions" placeholder="Semua status" />
    </div>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Tidak ada komentar untuk dimoderasi."
    >
      <BulkActionBar
        v-if="canModerate"
        :count="sel.count.value"
        :busy="busy"
        @delete="onBulkDelete"
        @clear="sel.clear"
      />

      <div class="border-border bg-surface overflow-x-auto rounded-xl border">
        <table class="w-full min-w-[960px] text-left text-sm">
          <thead class="border-border text-text-muted border-b text-xs uppercase">
            <tr>
              <th v-if="canModerate" class="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  class="accent-primary size-4 rounded"
                  :checked="sel.allSelected(pageIds)"
                  @change="toggleAll(($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th class="px-4 py-3 font-semibold">Komentar</th>
              <th class="px-4 py-3 font-semibold">Waktu</th>
              <th class="px-4 py-3 font-semibold">Nama</th>
              <th class="px-4 py-3 font-semibold">Email</th>
              <th class="px-4 py-3 font-semibold">Berita</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in data!.items"
              :key="c.id"
              class="border-border/60 border-b last:border-0 align-top"
              :class="sel.has(c.id) ? 'bg-primary-light/40' : ''"
            >
              <td v-if="canModerate" class="px-4 py-3">
                <input
                  type="checkbox"
                  class="accent-primary size-4 rounded"
                  :checked="sel.has(c.id)"
                  @change="sel.toggle(c.id)"
                />
              </td>
              <!-- Isi komentar -->
              <td class="max-w-sm px-4 py-3">
                <Badge v-if="c.parentId" variant="info" class="mb-1">
                  <CornerDownRight class="h-3 w-3" /> Balasan
                </Badge>
                <p class="text-text-primary whitespace-pre-line break-words">{{ previewBody(c) }}</p>
                <button
                  v-if="isLong(c.body)"
                  type="button"
                  class="text-primary mt-1 text-xs font-semibold hover:underline"
                  @click="toggleExpand(c.id)"
                >
                  {{ expanded.has(c.id) ? 'Sembunyikan' : '…lihat semua' }}
                </button>
              </td>
              <!-- Waktu -->
              <td class="text-text-muted whitespace-nowrap px-4 py-3">{{ formatDate(c.createdAt, true) }}</td>
              <!-- Nama -->
              <td class="text-text-primary whitespace-nowrap px-4 py-3">{{ c.authorName || 'Anonim' }}</td>
              <!-- Email -->
              <td class="text-text-muted whitespace-nowrap px-4 py-3">{{ c.authorEmail || '—' }}</td>
              <!-- Target berita -->
              <td class="max-w-[200px] px-4 py-3">
                <span class="text-text-primary line-clamp-2" :title="c.article?.title || ''">
                  {{ c.article?.title || '—' }}
                </span>
              </td>
              <!-- Status -->
              <td class="px-4 py-3">
                <Badge :variant="commentStatusVariant[c.status]">{{ commentStatusLabel[c.status] }}</Badge>
              </td>
              <!-- Aksi -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <Button
                    v-if="c.status !== 'SPAM'"
                    size="sm"
                    variant="secondary"
                    @click="openReply(c)"
                  >
                    <Reply class="h-4 w-4" /> Balas
                  </Button>
                  <Button
                    v-if="canModerate && c.status !== 'APPROVED'"
                    size="sm"
                    variant="secondary"
                    :loading="busy"
                    @click="run(approve.mutateAsync(c.id), 'Komentar disetujui.')"
                  >
                    Approve
                  </Button>
                  <Button
                    v-if="canModerate && c.status !== 'SPAM'"
                    size="sm"
                    variant="ghost"
                    :loading="busy"
                    @click="run(spam.mutateAsync(c.id), 'Komentar ditandai spam.')"
                  >
                    Spam
                  </Button>
                  <Button
                    v-if="canModerate"
                    size="sm"
                    variant="ghost"
                    :loading="busy"
                    @click="onDelete(c)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5">
        <Pagination
          :page="data!.meta.page"
          :per-page="data!.meta.perPage"
          :total="data!.meta.total"
          :total-pages="data!.meta.totalPages"
          @update:page="page = $event"
        />
      </div>
    </QueryState>

    <!-- Balas komentar (panitia) -->
    <Modal v-model:open="replyOpen" title="Balas Komentar" size="md">
      <div v-if="replyTarget" class="flex flex-col gap-4">
        <div class="border-border bg-bg-subtle/50 rounded-lg border p-3 text-sm">
          <p class="text-text-muted mb-1 text-xs">
            Membalas {{ replyTarget.authorName || 'Anonim' }}:
          </p>
          <p class="text-text-primary whitespace-pre-line break-words line-clamp-4">
            {{ replyTarget.body }}
          </p>
        </div>
        <Textarea
          v-model="replyBody"
          label="Balasan Anda"
          placeholder="Tulis balasan resmi panitia…"
          :rows="4"
          :error="replyError"
        />
        <p class="text-text-subtle text-xs">
          Balasan langsung tampil ke publik dan ditandai sebagai panitia. Bila komentar
          masih menunggu, balasan akan otomatis menyetujuinya.
        </p>
      </div>
      <template #footer>
        <Button variant="secondary" @click="replyOpen = false">Batal</Button>
        <Button :loading="reply.isPending.value" @click="onReply">Kirim Balasan</Button>
      </template>
    </Modal>
  </div>
</template>
