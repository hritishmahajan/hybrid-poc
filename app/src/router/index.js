import { createRouter, createWebHashHistory } from 'vue-router'

// Lazy-load each page for smaller initial bundle
const routes = [
  {
    path: '/',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: 'Home' }
  },
  {
    path: '/camera',
    component: () => import('@/pages/CameraPage.vue'),
    meta: { title: 'Camera' }
  },
  {
    path: '/location',
    component: () => import('@/pages/LocationPage.vue'),
    meta: { title: 'Location' }
  },
  {
    path: '/notify',
    component: () => import('@/pages/NotifyPage.vue'),
    meta: { title: 'Notifications' }
  },
  {
    // Catch-all 404
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  // Hash history works perfectly inside Cordova webview (no server needed)
  history: createWebHashHistory(),
  routes
})

// Update document title on navigation
router.afterEach((to) => {
  document.title = `HybridPOC – ${to.meta.title ?? 'App'}`
})

export default router
