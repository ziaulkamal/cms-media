/** admin/src/main.ts — entry SPA: pasang Pinia, Vue Query, router, lalu mount. */
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/css/app.css';
import router from './router';

createApp(App).use(createPinia()).use(VueQueryPlugin).use(router).mount('#app');
