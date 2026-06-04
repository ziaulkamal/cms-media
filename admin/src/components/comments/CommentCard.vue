<!-- admin/src/components/comments/CommentCard.vue — kartu komentar untuk moderasi. -->
<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import { commentStatusLabel, commentStatusVariant } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import type { CommentModeration } from '@/types/cms';

defineProps<{ comment: CommentModeration; busy?: boolean }>();
const emit = defineEmits<{ approve: [id: string]; spam: [id: string] }>();
</script>

<template>
  <div class="border-border bg-surface rounded-lg border p-4">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="text-text-primary text-sm font-medium">
          {{ comment.authorName || 'Anonim' }}
        </span>
        <Badge :variant="commentStatusVariant[comment.status]">
          {{ commentStatusLabel[comment.status] }}
        </Badge>
      </div>
      <span class="text-text-subtle text-xs">{{ formatDate(comment.createdAt, true) }}</span>
    </div>
    <p class="text-text-primary mb-3 whitespace-pre-line text-sm">{{ comment.body }}</p>
    <div class="flex gap-2">
      <Button
        v-if="comment.status !== 'APPROVED'"
        size="sm"
        :loading="busy"
        @click="emit('approve', comment.id)"
      >
        Setujui
      </Button>
      <Button
        v-if="comment.status !== 'SPAM'"
        size="sm"
        variant="danger"
        :loading="busy"
        @click="emit('spam', comment.id)"
      >
        Spam
      </Button>
    </div>
  </div>
</template>
