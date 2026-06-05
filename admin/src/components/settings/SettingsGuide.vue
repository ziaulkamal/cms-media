<!-- admin/src/components/settings/SettingsGuide.vue — panduan penggunaan halaman settings dalam bentuk accordion. -->
<script setup lang="ts">
import { ref, type Component } from 'vue';
import {
  BookOpen,
  ChevronDown,
  Globe,
  ListTree,
  Pencil,
  Plus,
  Trash2,
  Type,
} from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';

/** Satu seksi panduan: ikon, judul, dan butir-butir penjelasan. */
interface GuideSection {
  icon: Component;
  title: string;
  body: string[];
}

const sections: GuideSection[] = [
  {
    icon: BookOpen,
    title: 'Apa itu Pengaturan?',
    body: [
      'Halaman ini menyimpan konfigurasi situs yang dinamis — nilainya bisa diubah tanpa menyentuh kode.',
      'Setiap setting dikelompokkan ke dalam tab (group) seperti general, seo, atau social.',
    ],
  },
  {
    icon: Pencil,
    title: 'Mengubah nilai',
    body: [
      'Ubah nilai pada kolom yang tersedia, lalu klik tombol "Simpan Perubahan".',
      'Perubahan disimpan sekaligus (bulk) untuk semua tab, jadi cukup satu kali simpan.',
    ],
  },
  {
    icon: ListTree,
    title: 'Tab & Group',
    body: [
      'Gunakan tab di atas daftar untuk berpindah antar kelompok setting.',
      'Group baru otomatis muncul sebagai tab begitu ada setting yang memakainya.',
    ],
  },
  {
    icon: Type,
    title: 'Tipe setting',
    body: [
      'Teks singkat & panjang untuk string biasa, Angka untuk nilai numerik.',
      'Boolean tampil sebagai checkbox, URL untuk tautan, dan JSON untuk data terstruktur.',
    ],
  },
  {
    icon: Plus,
    title: 'Menambah setting',
    body: [
      'Klik "Tambah Setting", isi key unik (mis. site_title), pilih tipe dan group.',
      'Key sebaiknya memakai snake_case agar konsisten dan mudah dipanggil.',
    ],
  },
  {
    icon: Globe,
    title: 'Setting publik',
    body: [
      'Tandai "publik" bila nilai boleh dibaca front-end tanpa login — cocok untuk SEO/meta.',
      'Jangan tandai publik untuk data sensitif seperti kunci API.',
    ],
  },
  {
    icon: Trash2,
    title: 'Menghapus setting',
    body: [
      'Klik ikon tempat sampah di samping setting untuk menghapusnya permanen.',
      'Akan ada konfirmasi terlebih dahulu — hapus hanya setting yang benar-benar tidak terpakai.',
    ],
  },
];

// Indeks seksi yang terbuka; awalnya seksi pertama.
const open = ref<number>(0);

/** Buka/tutup seksi (accordion satu-terbuka). */
function toggle(index: number): void {
  open.value = open.value === index ? -1 : index;
}
</script>

<template>
  <Card title="Panduan Penggunaan" subtitle="Cara mengelola pengaturan situs" :icon="BookOpen">
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
