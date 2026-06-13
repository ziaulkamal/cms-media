<!-- admin/src/components/dashboard/DonutChart.vue — donut komposisi (Chart.js via vue-chartjs). -->
<script setup lang="ts">
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{ labels: string[]; values: number[] }>();

/** Palet token-ish (selaras gradient brand) untuk irisan donut. */
const PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#94a3b8', '#f59e0b'];

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: props.labels.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 0,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 14 } },
  },
};
</script>

<template>
  <div class="h-56">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
