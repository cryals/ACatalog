import { createRouter, createWebHistory } from 'vue-router'
import CatalogPage from '@/pages/CatalogPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'catalog', component: CatalogPage },
    { path: '/favorites', name: 'favorites', component: CatalogPage, props: { favoritesOnly: true } },
    { path: '/apps/:slug', name: 'app', component: () => import('@/pages/AppDetailsPage.vue') },
    { path: '/compare', name: 'compare', component: () => import('@/pages/ComparePage.vue') },
    { path: '/quality', name: 'quality', component: () => import('@/pages/QualityPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
