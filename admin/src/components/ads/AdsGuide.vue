<!-- admin/src/components/ads/AdsGuide.vue — panduan penggunaan monetisasi, kontekstual per tab (slot/creative). -->
<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue';
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  Code2,
  Image as ImageIcon,
  LayoutGrid,
  ListOrdered,
  Megaphone,
  Ruler,
  Smartphone,
  ToggleRight,
} from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';

const props = defineProps<{ tab: 'slots' | 'creatives' }>();

/** Satu seksi panduan: ikon, judul, dan butir-butir penjelasan. */
interface GuideSection {
  icon: Component;
  title: string;
  body: string[];
}

const slotSections: GuideSection[] = [
  {
    icon: LayoutGrid,
    title: 'Apa itu Slot?',
    body: [
      'Slot adalah posisi iklan bernama pada situs — mis. "Home — Atas" atau "Sidebar".',
      'Front-end memanggil slot lewat key-nya, jadi key bersifat tetap dan unik.',
    ],
  },
  {
    icon: Ruler,
    title: 'Key & Dimensi',
    body: [
      'Key pakai snake_case (mis. home_top) dan tidak bisa diubah setelah dibuat.',
      'Lebar × tinggi menentukan ukuran kotak iklan; kosongkan bila ukuran fleksibel.',
    ],
  },
  {
    icon: Smartphone,
    title: 'Dukungan AMP',
    body: [
      'Aktifkan AMP bila slot ini boleh tampil di halaman versi AMP.',
      'Hanya creative yang kompatibel AMP yang akan dirender di sana.',
    ],
  },
  {
    icon: ToggleRight,
    title: 'Status Aktif',
    body: [
      'Slot nonaktif tetap tersimpan tapi tidak dirender di front-end.',
      'Gunakan untuk menyetop sementara sebuah posisi tanpa menghapusnya.',
    ],
  },
];

const creativeSections: GuideSection[] = [
  {
    icon: Megaphone,
    title: 'Apa itu Creative?',
    body: [
      'Creative adalah materi iklan yang mengisi sebuah slot.',
      'Pilih slot di atas tabel; satu slot bisa punya banyak creative.',
    ],
  },
  {
    icon: ImageIcon,
    title: 'Jenis materi',
    body: [
      'House Image: gambar + URL tujuan untuk iklan internal.',
      'House HTML: cuplikan HTML bebas. AdSense: isi ad client, slot, dan format.',
    ],
  },
  {
    icon: ListOrdered,
    title: 'Prioritas & Rotasi',
    body: [
      'Prioritas lebih tinggi tampil lebih dulu saat beberapa creative bersaing.',
      'Nilai sama akan dirotasi agar tampil bergantian.',
    ],
  },
  {
    icon: CalendarClock,
    title: 'Jadwal tayang',
    body: [
      'Isi "Mulai" / "Selesai" untuk membatasi rentang tayang creative.',
      'Kosongkan keduanya agar creative tayang selama statusnya aktif.',
    ],
  },
  {
    icon: Code2,
    title: 'Status creative',
    body: [
      'Draft untuk persiapan, Aktif untuk tayang, dan Arsip untuk menghentikan.',
      'Hanya creative berstatus Aktif (dan dalam jadwal) yang dirender.',
    ],
  },
];

const sections = computed(() => (props.tab === 'slots' ? slotSections : creativeSections));
const subtitle = computed(() =>
  props.tab === 'slots' ? 'Cara mengelola posisi iklan' : 'Cara mengelola materi iklan',
);

// Indeks seksi yang terbuka; awalnya seksi pertama. Reset saat pindah tab.
const open = ref<number>(0);
watch(
  () => props.tab,
  () => (open.value = 0),
);

/** Buka/tutup seksi (accordion satu-terbuka). */
function toggle(index: number): void {
  open.value = open.value === index ? -1 : index;
}
</script>

<template>
  <Card title="Panduan Penggunaan" :subtitle="subtitle" :icon="BookOpen">
    <div class="flex flex-col gap-2">
      <div
        v-for="(section, i) in sections"
        :key="section.title"
        class="border-border overflow-hidden rounded-lg border"
      >
        <button
          type="button"
          class="hover:bg-bg-subtle flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
          :aria-expanded="open === i"
          @click="toggle(i)"
        >
          <span
            class="bg-primary-light text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          >
            <component :is="section.icon" class="h-4 w-4" />
          </span>
          <span class="text-text-primary flex-1 text-sm font-medium">{{ section.title }}</span>
          <ChevronDown
            class="text-text-subtle h-4 w-4 shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': open === i }"
          />
        </button>

        <div
          class="grid transition-all duration-200 ease-out"
          :class="open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden">
            <div class="text-text-muted flex flex-col gap-1.5 px-3 pb-3 pl-13 text-xs leading-relaxed">
              <p v-for="(line, j) in section.body" :key="j">{{ line }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
