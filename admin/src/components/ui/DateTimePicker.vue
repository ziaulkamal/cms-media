<!-- admin/src/components/ui/DateTimePicker.vue — date+time picker custom (kalender + jam) bergaya tema, ganti native datetime-local. -->
<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import { CalendarClock, ChevronLeft, ChevronRight, X } from 'lucide-vue-next';
import dayjs, { type Dayjs } from 'dayjs';
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Nilai datetime-local "YYYY-MM-DDTHH:mm" (kompatibel native). */
    modelValue: string;
    placeholder?: string;
    error?: string;
  }>(),
  { placeholder: 'Pilih tanggal & waktu' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;
const WEEKDAYS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const selected = computed<Dayjs | null>(() =>
  props.modelValue ? dayjs(props.modelValue) : null,
);

/** State lokal: hari dipilih + jam/menit, dikomposisikan saat commit. */
const pickedDay = ref<Dayjs | null>(selected.value);
const hour = ref<number>(selected.value?.hour() ?? 9);
const minute = ref<number>(selected.value ? selected.value.minute() : 0);
const viewMonth = ref<Dayjs>((selected.value ?? dayjs()).startOf('month'));

// Sinkron ulang bila parent mengubah/mengosongkan nilai dari luar.
watch(
  () => props.modelValue,
  (val) => {
    const d = val ? dayjs(val) : null;
    pickedDay.value = d;
    if (d) {
      hour.value = d.hour();
      minute.value = Math.round(d.minute() / 5) * 5 % 60;
      viewMonth.value = d.startOf('month');
    }
  },
);

const today = dayjs().startOf('day');

/** 42 sel kalender (6 baris), Senin sebagai awal pekan. */
const grid = computed<Dayjs[]>(() => {
  const first = viewMonth.value.startOf('month');
  const offset = (first.day() + 6) % 7; // Minggu(0) -> 6, Senin(1) -> 0
  const start = first.subtract(offset, 'day');
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
});

const monthLabel = computed(
  () => `${MONTHS[viewMonth.value.month()]} ${viewMonth.value.year()}`,
);

const displayLabel = computed(() => {
  const d = selected.value;
  if (!d) return '';
  return `${d.date()} ${MONTHS[d.month()].slice(0, 3)} ${d.year()} • ${pad(d.hour())}:${pad(d.minute())}`;
});

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function isSameDay(a: Dayjs, b: Dayjs | null): boolean {
  return b != null && a.isSame(b, 'day');
}
function isOtherMonth(d: Dayjs): boolean {
  return d.month() !== viewMonth.value.month();
}

function commit(): void {
  if (!pickedDay.value) return;
  const composed = pickedDay.value
    .hour(hour.value)
    .minute(minute.value)
    .second(0);
  emit('update:modelValue', composed.format('YYYY-MM-DDTHH:mm'));
}

function selectDay(d: Dayjs): void {
  pickedDay.value = d;
  commit();
}
function setToday(): void {
  const now = dayjs();
  pickedDay.value = now.startOf('day');
  hour.value = now.hour();
  minute.value = Math.round(now.minute() / 5) * 5 % 60;
  viewMonth.value = now.startOf('month');
  commit();
}
function clear(): void {
  pickedDay.value = null;
  emit('update:modelValue', '');
}
function shiftMonth(delta: number): void {
  viewMonth.value = viewMonth.value.add(delta, 'month');
}
</script>

<template>
  <Popover v-slot="{ close }" class="relative">
    <PopoverButton
      class="border-border bg-surface text-text-primary flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-primary"
      :class="error ? 'border-danger' : ''"
    >
      <CalendarClock class="text-text-subtle h-4 w-4 shrink-0" />
      <span v-if="displayLabel" class="truncate">{{ displayLabel }}</span>
      <span v-else class="text-text-subtle truncate">{{ placeholder }}</span>
      <X
        v-if="selected"
        class="text-text-subtle hover:text-text-primary ml-auto h-3.5 w-3.5 shrink-0 transition-colors"
        @click.stop="clear"
      />
    </PopoverButton>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <PopoverPanel
        class="bg-surface border-border absolute z-30 mt-2 w-72 rounded-xl border p-3 shadow-lg focus:outline-none"
      >
        <!-- Navigasi bulan -->
        <div class="mb-2 flex items-center justify-between">
          <button
            type="button"
            class="text-text-muted hover:bg-bg-subtle hover:text-text-primary flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            aria-label="Bulan sebelumnya"
            @click="shiftMonth(-1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="text-text-primary text-sm font-semibold">{{ monthLabel }}</span>
          <button
            type="button"
            class="text-text-muted hover:bg-bg-subtle hover:text-text-primary flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            aria-label="Bulan berikutnya"
            @click="shiftMonth(1)"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>

        <!-- Header hari -->
        <div class="text-text-subtle mb-1 grid grid-cols-7 gap-0.5 text-center text-xs font-medium">
          <span v-for="w in WEEKDAYS" :key="w" class="py-1">{{ w }}</span>
        </div>

        <!-- Grid tanggal -->
        <div class="grid grid-cols-7 gap-0.5">
          <button
            v-for="d in grid"
            :key="d.valueOf()"
            type="button"
            class="relative flex h-8 items-center justify-center rounded-md text-sm transition-colors"
            :class="[
              isSameDay(d, pickedDay)
                ? 'bg-primary font-semibold text-white'
                : isOtherMonth(d)
                  ? 'text-text-subtle hover:bg-bg-subtle'
                  : 'text-text-primary hover:bg-primary-light hover:text-primary',
            ]"
            @click="selectDay(d)"
          >
            {{ d.date() }}
            <span
              v-if="d.isSame(today, 'day') && !isSameDay(d, pickedDay)"
              class="bg-primary absolute bottom-1 h-1 w-1 rounded-full"
            />
          </button>
        </div>

        <!-- Pemilih waktu -->
        <div class="border-border mt-3 flex items-center gap-2 border-t pt-3">
          <span class="text-text-muted text-xs font-medium">Waktu</span>
          <div class="ml-auto flex items-center gap-1">
            <select
              v-model.number="hour"
              class="border-border bg-surface text-text-primary h-8 rounded-md border px-1.5 text-sm outline-none focus:border-primary"
              aria-label="Jam"
              @change="commit"
            >
              <option v-for="h in HOURS" :key="h" :value="h">{{ pad(h) }}</option>
            </select>
            <span class="text-text-muted">:</span>
            <select
              v-model.number="minute"
              class="border-border bg-surface text-text-primary h-8 rounded-md border px-1.5 text-sm outline-none focus:border-primary"
              aria-label="Menit"
              @change="commit"
            >
              <option v-for="m in MINUTES" :key="m" :value="m">{{ pad(m) }}</option>
            </select>
          </div>
        </div>

        <!-- Aksi cepat -->
        <div class="mt-3 flex items-center justify-between">
          <button
            type="button"
            class="text-primary text-xs font-medium hover:underline"
            @click="setToday"
          >
            Hari ini
          </button>
          <button
            type="button"
            class="text-text-muted hover:text-text-primary text-xs font-medium"
            @click="close()"
          >
            Selesai
          </button>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>
