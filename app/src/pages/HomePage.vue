<template>
  <q-page class="br-page">
    <div class="br-inner">

      <!-- Header block -->
      <div class="br-hero anim-fade-up">
        <div class="br-hero-tag">HYBRID MOBILE APP · POC v1.0</div>
        <div class="br-hero-title">NATIVE<br>POC</div>
        <div class="br-hero-sub">Cordova + Vue 3 + Quasar + Vite</div>
      </div>

      <!-- Status strip -->
      <div class="br-status-strip anim-fade-up-1">
        <div class="br-status-item">
          <span class="br-status-label">MODE</span>
          <span class="br-status-val">{{ isNative ? 'NATIVE' : 'BROWSER' }}</span>
        </div>
        <div class="br-status-divider" />
        <div class="br-status-item">
          <span class="br-status-label">PLATFORM</span>
          <span class="br-status-val">{{ platform }}</span>
        </div>
        <div class="br-status-divider" />
        <div class="br-status-item">
          <span class="br-status-label">STATUS</span>
          <span class="br-status-val br-status-ok">ACTIVE</span>
        </div>
      </div>

      <!-- Device info grid -->
      <div class="br-section-header anim-fade-up-2">
        <span class="br-section-num">01</span>
        <span class="br-section-title">DEVICE INFO</span>
      </div>
      <div class="br-info-grid anim-fade-up-2">
        <div v-for="card in deviceCards" :key="card.label" class="br-info-cell">
          <div class="br-info-label">{{ card.label }}</div>
          <div class="br-info-val">{{ card.value }}</div>
        </div>
      </div>

      <!-- Features -->
      <div class="br-section-header anim-fade-up-3">
        <span class="br-section-num">02</span>
        <span class="br-section-title">FEATURES</span>
      </div>
      <div class="br-feat-list anim-fade-up-3">
        <div
          v-for="(feat, i) in features" :key="feat.to"
          class="br-feat-row"
          @click="$router.push(feat.to)"
        >
          <div class="br-feat-num">0{{ i + 1 }}</div>
          <div class="br-feat-text">
            <div class="br-feat-name">{{ feat.label.toUpperCase() }}</div>
            <div class="br-feat-desc">{{ feat.desc }}</div>
          </div>
          <div class="br-feat-tag">{{ feat.tag }}</div>
        </div>
      </div>

      <!-- Stack -->
      <div class="br-section-header anim-fade-up-4">
        <span class="br-section-num">03</span>
        <span class="br-section-title">STACK</span>
      </div>
      <div class="br-stack anim-fade-up-4">
        <span v-for="tech in stack" :key="tech" class="br-stack-tag">{{ tech }}</span>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
const $router = useRouter()
const isNative = computed(() => !!window.cordova)
const platform = computed(() => window.device?.platform ?? navigator.platform.split(' ')[0])

const deviceCards = computed(() => {
  const d = window.device
  return [
    { label: 'PLATFORM', value: d?.platform ?? navigator.platform.split(' ')[0] },
    { label: 'VERSION',  value: d?.version  ?? 'WEB'    },
    { label: 'MODEL',    value: d?.model    ?? 'BROWSER' },
    { label: 'UUID',     value: d?.uuid?.slice(0,8) ?? 'N/A' },
  ]
})

const features = [
  { to: '/camera',   label: 'Camera',        desc: 'Capture & share photos',     tag: 'READY' },
  { to: '/location', label: 'Geolocation',   desc: 'GPS, live tracking, map',    tag: 'READY' },
  { to: '/notify',   label: 'Notifications', desc: 'Local & push alerts',        tag: 'READY' },
]

const stack = ['VUE 3', 'QUASAR 2', 'CORDOVA', 'VITE 5', 'ES6+', 'LEAFLET']
</script>

<style scoped>
.br-page  { background: #fff; min-height: 100vh }
.br-inner { padding: 0 }

/* Hero */
.br-hero { border-bottom: 2px solid #000; padding: 20px 16px 16px }
.br-hero-tag   { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #888; margin-bottom: 8px }
.br-hero-title { font-family: 'IBM Plex Mono',monospace; font-size: 3rem; font-weight: 700; color: #000; line-height: 0.9; letter-spacing: -2px; margin-bottom: 10px }
.br-hero-sub   { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #555; letter-spacing: 0.5px }

/* Status strip */
.br-status-strip { display: flex; border-bottom: 2px solid #000 }
.br-status-item  { flex: 1; padding: 10px 12px }
.br-status-divider { width: 2px; background: #000 }
.br-status-label { display: block; font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #888; margin-bottom: 3px }
.br-status-val   { font-family: 'IBM Plex Mono',monospace; font-size: 11px; font-weight: 700; color: #000 }
.br-status-ok    { color: #000 }

/* Section headers */
.br-section-header { display: flex; align-items: center; gap: 10px; background: #000; padding: 8px 16px }
.br-section-num    { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; color: #666 }
.br-section-title  { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #fff }

/* Device info grid */
.br-info-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #000 }
.br-info-cell { padding: 12px 16px; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0 }
.br-info-cell:nth-child(2n) { border-right: none }
.br-info-cell:nth-last-child(-n+2) { border-bottom: none }
.br-info-label { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #888; margin-bottom: 4px }
.br-info-val   { font-family: 'IBM Plex Mono',monospace; font-size: 12px; font-weight: 700; color: #000; word-break: break-all }

/* Features */
.br-feat-list { border-bottom: 2px solid #000 }
.br-feat-row  { display: flex; align-items: center; gap: 0; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.1s }
.br-feat-row:last-child { border-bottom: none }
.br-feat-row:hover { background: #f5f5f5 }
.br-feat-num  { font-family: 'IBM Plex Mono',monospace; font-size: 11px; font-weight: 700; color: #fff; background: #000; padding: 14px 14px; min-width: 44px; text-align: center; align-self: stretch; display: flex; align-items: center }
.br-feat-text { flex: 1; padding: 12px 14px }
.br-feat-name { font-family: 'IBM Plex Mono',monospace; font-size: 12px; font-weight: 700; color: #000; letter-spacing: 0.5px }
.br-feat-desc { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #888; margin-top: 3px }
.br-feat-tag  { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1px; background: #000; color: #fff; padding: 4px 8px; margin-right: 14px }

/* Stack */
.br-stack { display: flex; flex-wrap: wrap; gap: 0; border-bottom: 2px solid #000 }
.br-stack-tag { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 10px 14px; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; color: #000 }
</style>