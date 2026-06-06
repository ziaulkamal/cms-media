<!-- admin/src/components/ui/SelectableTile.vue — kartu media modern: gambar, checkbox seleksi, aksi hover, footer. -->
<script setup lang="ts">
import { Check } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    selected?: boolean;
    aspect?: string;
  }>(),
  { aspect: 'aspect-square' },
);
defineEmits<{ (e: 'toggle'): void }>();
</script>

<template>
  <figure
    class="group border-border bg-surface relative overflow-hidden rounded-2xl border transition"
    :class="selected ? 'ring-primary ring-2' : 'hover:shadow-md'"
  >
    <div class="relative overflow-hidden" :class="aspect">
      <img
        :src="src"
        :alt="alt ?? ''"
        loading="lazy"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <!-- Lapisan gelap halus saat hover/terpilih agar kontrol terbaca -->
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10 opacity-0 transition group-hover:opacity-100"
        :class="selected ? 'opacity-100' : ''"
      />

      <!-- Checkbox seleksi (muncul saat hover atau saat terpilih) -->
      <button
        type="button"
        aria-label="Pilih"
        class="absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-md border-2 shadow-sm transition"
        :class="
          selected
            ? 'border-primary bg-primary text-white'
            : 'border-white/90 bg-black/25 text-transparent opacity-0 group-hover:opacity-100'
        "
        @click="$emit('toggle')"
      >
        <Check class="size-4" />
      </button>

      <!-- Aksi hover (edit/hapus) -->
      <div class="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <slot name="actions" />
      </div>

      <!-- Konten yang menempel di bawah gambar (mis. caption overlay) -->
      <div class="absolute inset-x-0 bottom-0 z-10">
        <slot name="overlay" />
      </div>
    </div>

    <figcaption v-if="$slots.footer" class="p-3">
      <slot name="footer" />
    </figcaption>
  </figure>
</template>
