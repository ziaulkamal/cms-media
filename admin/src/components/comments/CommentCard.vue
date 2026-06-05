<!-- admin/src/components/comments/CommentCard.vue — kartu komentar moderasi (artikel asal, terbit, aksi). -->
<script setup lang="ts">
import { computed } from 'vue';
import { Check, Clock, FileText, ShieldAlert } from 'lucide-vue-next';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import { commentStatusLabel, commentStatusVariant } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import type { CommentModeration } from '@/types/cms';

const props = defineProps<{ comment: CommentModeration; busy?: boolean }>();
const emit = defineEmits<{ approve: [id: string]; spam: [id: string] }>();

/** Inisial untuk avatar (huruf pertama nama, fallback "?"). */
const initial = computed(
  () => (props.comment.authorName?.trim()?.[0] ?? '?').toUpperCase(),
);

/** Garis aksen kiri mengikuti status komentar. */
const accent = computed(
  () =>
    ({
      PENDING: 'before:bg-warning',
      APPROVED: 'before:bg-success',
      SPAM: 'before:bg-danger',
    })[props.comment.status],
);
</script>

<template>
  <article
    :class="accent"
    class="group border-border bg-surface relative overflow-hidden rounded-xl border p-5 transition-shadow hover:shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']"
  >
    <header class="mb-3 flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <span
          class="bg-primary-light text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {{ initial }}
        </span>
        <div class="min-w-0">
          <p class="text-text-primary truncate text-sm font-semibold">
            {{ comment.authorName || 'Anonim' }}
          </p>
          <span
            class="text-text-subtle mt-0.5 flex items-center gap-1 text-xs"
          >
            <Clock class="h-3 w-3" />
            {{ formatDate(comment.createdAt, true) }}
          </span>
        </div>
      </div>
      <Badge :variant="commentStatusVariant[comment.status]">
        {{ commentStatusLabel[comment.status] }}
      </Badge>
    </header>

    <RouterLink
      v-if="comment.article"
      :to="`/articles/${comment.article.id}/edit`"
      class="bg-bg-subtle text-text-muted hover:text-primary mb-3 inline-flex max-w-full items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors"
    >
      <FileText class="h-3.5 w-3.5 shrink-0" />
      <span class="truncate">{{ comment.article.title }}</span>
    </RouterLink>
    <p v-else class="text-text-subtle mb-3 text-xs italic">Artikel dihapus</p>

    <p class="text-text-primary whitespace-pre-line text-sm leading-relaxed">
      {{ comment.body }}
    </p>

    <footer class="mt-4 flex gap-2">
      <Button
        v-if="comment.status !== 'APPROVED'"
        size="sm"
        :loading="busy"
        @click="emit('approve', comment.id)"
      >
        <Check class="h-4 w-4" />
        Setujui
      </Button>
      <Button
        v-if="comment.status !== 'SPAM'"
        size="sm"
        variant="danger"
        :loading="busy"
        @click="emit('spam', comment.id)"
      >
        <ShieldAlert class="h-4 w-4" />
        Spam
      </Button>
    </footer>
  </article>
</template>
