<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawerOpen = !drawerOpen" />
        <q-toolbar-title>HYBRIDPOC</q-toolbar-title>
        <div class="env-tag">{{ isNative ? 'NATIVE' : 'BROWSER' }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above :width="220">
      <div class="drawer-inner">
        <div class="drawer-header">
          <div class="drawer-logo">H/POC</div>
          <div class="drawer-sub">HYBRID APP DEMO</div>
        </div>
        <div class="drawer-divider" />
        <div class="drawer-nav-label">NAVIGATION</div>
        <div
          v-for="(link, i) in navLinks" :key="link.to"
          class="drawer-item"
          :class="{ 'drawer-item--active': $route.path === link.to }"
          @click="$router.push(link.to); drawerOpen = false"
        >
          <span class="drawer-num">0{{ i + 1 }}</span>
          <span class="drawer-label">{{ link.label.toUpperCase() }}</span>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer>
      <div class="bottom-nav">
        <router-link
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path === link.to }"
        >
          <q-icon :name="link.icon" size="18px" />
          <span>{{ link.label.toUpperCase() }}</span>
        </router-link>
      </div>
    </q-footer>
  <QuickCapture />
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import QuickCapture from '@/components/QuickCapture.vue'
import { useRoute } from 'vue-router'

const drawerOpen = ref(false)
const $route     = useRoute()
const isNative   = computed(() => !!window.cordova)

const navLinks = [
  { to: '/',         icon: 'home',          label: 'Home'     },
  { to: '/camera',   icon: 'photo_camera',  label: 'Camera'   },
  { to: '/location', icon: 'location_on',   label: 'Location' },
  { to: '/notify',   icon: 'notifications', label: 'Notify'   },
]
</script>

<style scoped>
.env-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 700;
  letter-spacing: 1.5px;
  background: #fff; color: #000;
  padding: 3px 8px;
}

/* Drawer */
.drawer-inner { height: 100%; background: #fff; border-right: 2px solid #000 }
.drawer-header { padding: 20px 16px 14px }
.drawer-logo { font-family: 'IBM Plex Mono', monospace; font-size: 1.4rem; font-weight: 700; color: #000; letter-spacing: -1px }
.drawer-sub  { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #888; margin-top: 2px }
.drawer-divider { height: 2px; background: #000; margin: 0 }
.drawer-nav-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #888; padding: 14px 16px 6px; }
.drawer-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #e0e0e0; transition: background 0.1s }
.drawer-item:hover { background: #f5f5f5 }
.drawer-item--active { background: #000 !important }
.drawer-item--active .drawer-num,
.drawer-item--active .drawer-label { color: #fff !important }
.drawer-num   { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; color: #bbb; min-width: 24px }
.drawer-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #000 }

/* Bottom nav */
.bottom-nav { display: flex; background: #000; height: 56px }
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 3px; text-decoration: none;
  color: #666; border-right: 1px solid #333;
  font-family: 'IBM Plex Mono', monospace; font-size: 8px; font-weight: 700; letter-spacing: 1px;
  transition: background 0.1s;
}
.nav-item:last-child { border-right: none }
.nav-item--active { background: #fff; color: #000 }
.nav-item--active .q-icon { color: #000 }

/* Page transition */
.page-enter-active, .page-leave-active { transition: opacity 0.12s }
.page-enter-from, .page-leave-to { opacity: 0 }
</style>