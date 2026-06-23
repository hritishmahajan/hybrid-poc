<template>
  <q-page class="br-page">
    <div class="br-page-header anim-fade-up">
      <div class="br-page-eyebrow">FEATURE — 02</div>
      <div class="br-page-title">GEOLOCATION</div>
    </div>

    <!-- Actions -->
    <div class="br-action-bar anim-fade-up-1">
      <button class="br-btn br-btn--primary" :disabled="loading" @click="getCurrentPosition">
        <q-icon name="my_location" size="16px" />
        <span>{{ loading ? 'SCANNING_' : 'GET POSITION' }}</span>
      </button>
      <button v-if="!watching" class="br-btn br-btn--secondary" @click="startWatch">
        <q-icon name="track_changes" size="16px" /><span>WATCH</span>
      </button>
      <button v-else class="br-btn br-btn--live" @click="stopWatch">
        <span class="live-dot" />STOP
      </button>
      <button v-if="coords" class="br-btn br-btn--ghost" @click="clear">
        <q-icon name="clear" size="16px" />
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="br-error anim-fade-up">
      <span class="br-error-tag">ERR</span>
      <span>{{ error }}</span>
    </div>

    <!-- Coords -->
    <div v-if="coords" class="anim-fade-up-2">
      <!-- Coordinate grid -->
      <div class="br-coord-grid">
        <div class="br-coord-cell">
          <div class="br-coord-label">LAT</div>
          <div class="br-coord-val">{{ coords.latitude.toFixed(6) }}°</div>
        </div>
        <div class="br-coord-cell">
          <div class="br-coord-label">LON</div>
          <div class="br-coord-val">{{ coords.longitude.toFixed(6) }}°</div>
        </div>
        <div class="br-coord-cell">
          <div class="br-coord-label">ACC</div>
          <div class="br-coord-val">±{{ Math.round(coords.accuracy) }}m</div>
        </div>
        <div class="br-coord-cell">
          <div class="br-coord-label">ALT</div>
          <div class="br-coord-val">{{ coords.altitude != null ? Math.round(coords.altitude) + 'm' : 'N/A' }}</div>
        </div>
      </div>

      <!-- Address -->
      <div class="br-address-row">
        <span class="br-addr-tag">ADDR</span>
        <span class="br-addr-val">
          <span v-if="geocodeStatus === 'loading'">RESOLVING_</span>
          <span v-else-if="geocodeStatus === 'done'">{{ address }}</span>
          <span v-else>{{ coords.latitude.toFixed(4) }}°N {{ coords.longitude.toFixed(4) }}°E</span>
        </span>
      </div>

      <!-- Map -->
      <div ref="mapEl" class="br-map" />

      <!-- Map actions -->
      <div class="br-map-actions">
        <button class="br-map-btn" @click="openInMaps">
          <q-icon name="open_in_new" size="14px" /> OPEN IN MAPS
        </button>
        <button class="br-map-btn" @click="copyCoords">
          <q-icon name="content_copy" size="14px" /> COPY COORDS
        </button>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="br-empty anim-fade-up-2">
      <div class="br-empty-icon">[ GPS ]</div>
      <div class="br-empty-text">NO_POSITION_DATA</div>
      <div class="br-empty-sub">Tap GET POSITION to begin</div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useApi } from '@/composables/useApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { coords, error, loading, watching, getCurrentPosition, startWatch, stopWatch, clear } = useGeolocation()
const { logLocation } = useApi()
const address = ref(null), geocodeStatus = ref('idle'), mapEl = ref(null)
let leafletMap = null, marker = null

watch(coords, async (c) => {
  if (!c) { address.value = null; geocodeStatus.value = 'idle'; return }
  geocodeStatus.value = 'loading'
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.latitude}&lon=${c.longitude}`, { headers: { 'Accept-Language': 'en', 'User-Agent': 'NativePOC/1.0' } })
    address.value = (await res.json()).display_name ?? 'NOT FOUND'
    geocodeStatus.value = 'done'
    logLocation(c, address.value)
  } catch { geocodeStatus.value = 'error' }
  await nextTick(); await initMap(c.latitude, c.longitude)
})

async function initMap(lat, lon) {
  if (!window.L) {
    await Promise.all([
      new Promise(r => { const l = document.createElement('link'); l.rel='stylesheet'; l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; l.onload=r; document.head.appendChild(l) }),
      new Promise(r => { const s = document.createElement('script'); s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload=r; document.head.appendChild(s) })
    ])
  }
  const L = window.L
  if (!leafletMap) {
    leafletMap = L.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView([lat, lon], 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(leafletMap)
    const icon = L.divIcon({ html: `<div style="width:12px;height:12px;border-radius:50%;background:#000;border:3px solid #fff;outline:2px solid #000"></div>`, iconSize:[12,12], iconAnchor:[6,6], className:'' })
    marker = L.marker([lat,lon],{icon}).addTo(leafletMap)
  } else { leafletMap.setView([lat,lon],16); marker.setLatLng([lat,lon]) }
}

function openInMaps() { if (coords.value) window.open(`https://www.google.com/maps?q=${coords.value.latitude},${coords.value.longitude}`, '_blank') }
async function copyCoords() {
  if (!coords.value) return
  await navigator.clipboard.writeText(`${coords.value.latitude.toFixed(6)}, ${coords.value.longitude.toFixed(6)}`)
  $q.notify({ message: 'COORDS_COPIED', color: 'grey-10', textColor: 'white' })
}
</script>

<style scoped>
.br-page { background: #fff; min-height: 100vh }
.br-page-header { border-bottom: 2px solid #000; padding: 16px }
.br-page-eyebrow { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #888; margin-bottom: 4px }
.br-page-title   { font-family: 'IBM Plex Mono',monospace; font-size: 2rem; font-weight: 700; color: #000; letter-spacing: -1px }

.br-action-bar { display: flex; gap: 8px; border-bottom: 2px solid #000; padding: 14px 16px }
.br-btn { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; border: 2px solid #000; cursor: pointer; transition: all 0.1s }
.br-btn:active { transform: translate(2px,2px); box-shadow: none !important }
.br-btn:disabled { opacity: 0.4; cursor: not-allowed }
.br-btn--primary   { background: #000; color: #fff; box-shadow: 3px 3px 0 #555; flex: 1 }
.br-btn--secondary { background: #fff; color: #000; box-shadow: 3px 3px 0 #ccc }
.br-btn--live      { background: #fff; color: #000; box-shadow: 3px 3px 0 #ccc; display: flex; align-items: center; gap: 8px }
.br-btn--ghost     { background: #fff; color: #000; box-shadow: 3px 3px 0 #ccc; padding: 10px 12px }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #000; animation: blink 1s step-end infinite }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

.br-error { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 2px solid #000 }
.br-error-tag { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; background: #000; color: #fff; padding: 3px 7px; flex-shrink: 0 }
.br-error span { font-family: 'IBM Plex Mono',monospace; font-size: 11px; color: #000 }

.br-coord-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #000 }
.br-coord-cell { padding: 14px 16px; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0 }
.br-coord-cell:nth-child(2n) { border-right: none }
.br-coord-cell:nth-last-child(-n+2) { border-bottom: none }
.br-coord-label { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #888; margin-bottom: 4px }
.br-coord-val   { font-family: 'IBM Plex Mono',monospace; font-size: 14px; font-weight: 700; color: #000 }

.br-address-row { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-bottom: 2px solid #000; background: #f5f5f5 }
.br-addr-tag { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; background: #000; color: #fff; padding: 3px 6px; flex-shrink: 0; margin-top: 1px }
.br-addr-val { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #000; line-height: 1.5 }

.br-map { height: 200px; border-bottom: 2px solid #000 }

.br-map-actions { display: flex; border-bottom: 2px solid #000 }
.br-map-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px; background: #fff; border: none; border-right: 1px solid #e0e0e0; font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; cursor: pointer; color: #000; transition: background 0.1s }
.br-map-btn:last-child { border-right: none }
.br-map-btn:hover { background: #f0f0f0 }

.br-empty { padding: 48px 16px; text-align: center; border-bottom: 2px solid #000 }
.br-empty-icon { font-family: 'IBM Plex Mono',monospace; font-size: 2rem; font-weight: 700; color: #ccc; margin-bottom: 12px }
.br-empty-text { font-family: 'IBM Plex Mono',monospace; font-size: 13px; font-weight: 700; color: #000; margin-bottom: 6px }
.br-empty-sub  { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #888 }
</style>