<!-- admin/src/App.vue — root: render route aktif + container toast global. -->
<script setup lang="ts">
import MediaMetaDialog from '@/components/media/MediaMetaDialog.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ConfirmDialog />
  <MediaMetaDialog />
</template>
