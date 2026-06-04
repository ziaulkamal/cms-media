<!-- admin/src/components/dashboard/TrendChart.vue — line chart tren (Chart.js via vue-chartjs). -->
<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { computed } from 'vue';
import { Line } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const props = defineProps<{ labels: string[]; values: number[] }>();

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Artikel terbit',
      data: props.values,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
};
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
