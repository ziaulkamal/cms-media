/**
 * admin/src/router/index.ts
 * Definisi route + guard: butuh auth (fetchMe sekali) dan cek meta.roles (RBAC).
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types/cms';

declare module 'vue-router' {
  interface RouteMeta {
    /** Default true; set false untuk route publik (login). */
    requiresAuth?: boolean;
    /** Bila diisi, hanya role ini yang boleh masuk (selain itu -> 403). */
    roles?: UserRole[];
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/pages/errors/Forbidden.vue'),
    },
    {
      path: '/500',
      name: 'server-error',
      component: () => import('@/pages/errors/ServerError.vue'),
    },
    {
      // Shell terautentikasi; child route ditambahkan per fase.
      path: '/',
      component: () => import('@/layouts/BaseLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/Dashboard.vue'),
        },
        {
          path: 'articles',
          name: 'articles',
          component: () => import('@/pages/articles/Index.vue'),
        },
        {
          path: 'articles/new',
          name: 'article-new',
          component: () => import('@/pages/articles/Editor.vue'),
        },
        {
          path: 'articles/:id/edit',
          name: 'article-edit',
          component: () => import('@/pages/articles/Editor.vue'),
        },
        {
          path: 'pages',
          name: 'pages',
          component: () => import('@/pages/pages/Index.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        {
          path: 'pages/new',
          name: 'page-new',
          component: () => import('@/pages/pages/Editor.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        {
          path: 'pages/:id/edit',
          name: 'page-edit',
          component: () => import('@/pages/pages/Editor.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/pages/categories/Index.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        {
          path: 'tags',
          name: 'tags',
          component: () => import('@/pages/tags/Index.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        {
          path: 'media',
          name: 'media',
          component: () => import('@/pages/media/Index.vue'),
        },
        {
          path: 'comments',
          name: 'comments',
          component: () => import('@/pages/comments/Index.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        {
          path: 'ads',
          name: 'ads',
          component: () => import('@/pages/ads/Index.vue'),
          meta: { roles: ['ADMIN', 'EDITOR'] },
        },
        // Redirect path lama agar bookmark/tautan lama tetap berfungsi.
        { path: 'ads/slots', redirect: { name: 'ads' } },
        { path: 'ads/creatives', redirect: { name: 'ads' } },
        {
          path: 'admin/users',
          name: 'users',
          component: () => import('@/pages/users/Index.vue'),
          meta: { roles: ['ADMIN'] },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings/Index.vue'),
          meta: { roles: ['ADMIN'] },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/errors/NotFound.vue'),
    },
  ],
});

// Guard global: pastikan identitas dimuat, lalu tegakkan auth & RBAC.
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.loaded) await auth.fetchMe();

  if (to.name === 'login') {
    return auth.isAuthenticated ? { name: 'dashboard' } : true;
  }

  if (to.meta.requiresAuth === false) return true;

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  const roles = to.meta.roles;
  if (roles && roles.length > 0 && !auth.hasRole(...roles)) {
    return { name: 'forbidden' };
  }
  return true;
});

export default router;
