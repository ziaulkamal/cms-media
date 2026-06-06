<!-- admin/src/pages/branding/Index.vue — Tampilan Situs ▸ Branding: logo (main/footer × light/dark), favicon, slogan. -->
<script setup lang="ts">
import { reactive, watch } from 'vue';
import { ApiError } from '@/api/http';
import LogoUploader from '@/components/branding/LogoUploader.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useSettingMutations, useSettingsQuery } from '@/composables/useSettings';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const { data, isLoading, error } = useSettingsQuery();
const { bulkUpdate } = useSettingMutations();

const form = reactive<Record<string, string>>({
  site_slogan: '',
  logo_main_light: '',
  logo_main_dark: '',
  logo_footer_light: '',
  logo_footer_dark: '',
  favicon: '',
  og_default_image: '',
});

watch(
  data,
  (list) => {
    if (!list) return;
    for (const key of Object.keys(form)) {
      const s = list.find((x) => x.key === key);
      if (s) form[key] = (s.value ?? '') as string;
    }
  },
  { immediate: true },
);

async function onSave(): Promise<void> {
  try {
    await bulkUpdate.mutateAsync({ ...form });
    toast.success('Branding disimpan.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan branding.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Branding" subtitle="Logo, favicon, dan slogan situs WEB.">
      <template #actions>
        <Button :loading="bulkUpdate.isPending.value" @click="onSave">Simpan</Button>
      </template>
    </PageHeader>

    <QueryState :loading="isLoading" :error="error" :is-empty="false">
      <div class="flex flex-col gap-4">
        <Card>
          <h3 class="text-text-primary mb-1 text-sm font-semibold">Slogan</h3>
          <p class="text-text-subtle mb-3 text-xs">Tampil di area identitas footer.</p>
          <TextInput v-model="form.site_slogan" label="Slogan" placeholder="Bersatu, Berprestasi, Berjaya" />
        </Card>

        <Card>
          <h3 class="text-text-primary mb-1 text-sm font-semibold">Logo Main Menu (Navbar)</h3>
          <p class="text-text-subtle mb-4 text-xs">
            WEB memilih varian otomatis mengikuti mode terang/gelap. Kosongkan untuk pakai logo bawaan.
          </p>
          <div class="grid gap-5 sm:grid-cols-2">
            <LogoUploader v-model="form.logo_main_light" label="Logo — Light mode" hint="Untuk latar terang." />
            <LogoUploader v-model="form.logo_main_dark" label="Logo — Dark mode" hint="Untuk latar gelap." dark />
          </div>
        </Card>

        <Card>
          <h3 class="text-text-primary mb-1 text-sm font-semibold">Logo Footer</h3>
          <p class="text-text-subtle mb-4 text-xs">Footer berlatar gelap; biasanya pakai varian terang/putih.</p>
          <div class="grid gap-5 sm:grid-cols-2">
            <LogoUploader v-model="form.logo_footer_light" label="Logo — Light mode" hint="Untuk latar terang." />
            <LogoUploader v-model="form.logo_footer_dark" label="Logo — Dark mode" hint="Untuk latar gelap." dark />
          </div>
        </Card>

        <Card>
          <h3 class="text-text-primary mb-1 text-sm font-semibold">Favicon</h3>
          <p class="text-text-subtle mb-4 text-xs">Ikon tab browser (disarankan .png/.svg persegi).</p>
          <LogoUploader v-model="form.favicon" label="Favicon" hint="Ukuran kecil, persegi." />
        </Card>

        <Card>
          <h3 class="text-text-primary mb-1 text-sm font-semibold">Gambar Share Default (OG)</h3>
          <p class="text-text-subtle mb-4 text-xs">
            Dipakai saat halaman non-artikel dibagikan ke sosial media (disarankan 1200×630).
          </p>
          <LogoUploader v-model="form.og_default_image" label="OG Image" hint="Rasio 1.91:1, mis. 1200×630." dark />
        </Card>
      </div>
    </QueryState>
  </div>
</template>
