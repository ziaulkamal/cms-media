<!-- admin/src/components/articles/RevisionList.vue — daftar revisi (read-only). -->
<script setup lang="ts">
import Card from '@/components/ui/Card.vue';

// Catatan: revisi tercatat di backend, namun belum ada endpoint pembacaannya
// (GET revisions). Komponen ini siap pakai begitu endpoint tersedia.
defineProps<{ articleId?: string }>();
</script>

<template>
  <Card title="Riwayat Revisi">
    <p class="text-text-subtle text-sm">
      Revisi tersimpan otomatis di server. Tampilan riwayat akan aktif saat
      endpoint pembacaan revisi tersedia.
    </p>
  </Card>
</template>
