<!-- admin/src/components/articles/PublishPanel.vue — panel workflow & publikasi artikel. -->
<script setup lang="ts">
import { ref } from 'vue';
import { Archive, CalendarClock, Rocket, Send, Megaphone } from 'lucide-vue-next';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import DateTimePicker from '@/components/ui/DateTimePicker.vue';
import { articleStatusLabel, articleStatusVariant } from '@/lib/labels';
import type { ArticleStatus } from '@/types/cms';

defineProps<{
  status: ArticleStatus | null;
  canManagePublish: boolean;
  busy?: boolean;
  /** Pesan bila aksi workflow belum tersedia (mis. artikel belum disimpan). */
  lockedReason?: string;
}>();

const emit = defineEmits<{
  submit: [];
  publish: [payload: { publishedAt?: string }];
  archive: [];
}>();

const scheduleAt = ref('');

/** Konversi nilai datetime-local -> ISO untuk dikirim sebagai jadwal. */
function onSchedule(): void {
  if (!scheduleAt.value) return;
  emit('publish', { publishedAt: new Date(scheduleAt.value).toISOString() });
}
</script>

<template>
  <Card title="Publikasi" :icon="Megaphone">
    <div class="flex flex-col gap-4">
      <!-- Status saat ini -->
      <div class="bg-bg-subtle/60 border-border flex items-center justify-between rounded-lg border px-3 py-2.5">
        <span class="text-text-muted text-xs font-medium uppercase tracking-wide">Status</span>
        <Badge v-if="status" :variant="articleStatusVariant[status]">
          {{ articleStatusLabel[status] }}
        </Badge>
        <Badge v-else variant="neutral">Baru</Badge>
      </div>

      <p
        v-if="lockedReason"
        class="text-text-muted bg-warning-light/40 border-warning/20 rounded-lg border px-3 py-2.5 text-xs"
      >
        {{ lockedReason }}
      </p>

      <template v-else>
        <Button
          v-if="status === 'DRAFT'"
          variant="secondary"
          :loading="busy"
          block
          @click="emit('submit')"
        >
          <Send class="h-4 w-4" />
          Ajukan untuk Review
        </Button>

        <template v-if="canManagePublish && status !== 'PUBLISHED' && status !== 'ARCHIVED'">
          <Button :loading="busy" block @click="emit('publish', {})">
            <Rocket class="h-4 w-4" />
            Terbitkan Sekarang
          </Button>

          <div class="border-border flex flex-col gap-2 rounded-lg border border-dashed p-3">
            <label class="text-text-muted flex items-center gap-1.5 text-xs font-medium">
              <CalendarClock class="h-3.5 w-3.5" />
              Jadwalkan terbit
            </label>
            <DateTimePicker v-model="scheduleAt" placeholder="Pilih tanggal & waktu" />
            <Button
              variant="secondary"
              size="sm"
              :disabled="!scheduleAt"
              @click="onSchedule"
            >
              Jadwalkan
            </Button>
          </div>
        </template>

        <Button
          v-if="status && status !== 'ARCHIVED'"
          variant="ghost"
          size="sm"
          :loading="busy"
          block
          @click="emit('archive')"
        >
          <Archive class="h-3.5 w-3.5" />
          Arsipkan
        </Button>
      </template>
    </div>
  </Card>
</template>
