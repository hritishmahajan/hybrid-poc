<template>
  <!-- FAB trigger -->
  <button class="qc-fab" @click="open = true" title="Quick Capture">
    <q-icon name="add" size="24px" />
  </button>

  <!-- Overlay -->
  <teleport to="body">
    <div v-if="open" class="qc-overlay" @click.self="close">
      <div class="qc-panel">

        <!-- Header -->
        <div class="qc-header">
          <span class="qc-title">QUICK CAPTURE</span>
          <button class="qc-close" @click="close">✕</button>
        </div>

        <!-- Location -->
        <div class="qc-section">
          <div class="qc-section-label">01 — LOCATION</div>
          <div v-if="locStatus === 'idle'" class="qc-row">
            <button class="qc-btn" @click="captureLocation">
              <q-icon name="my_location" size="14px" /> GET GPS
            </button>
          </div>
          <div v-else-if="locStatus === 'loading'" class="qc-status">
            <span class="qc-blink">SCANNING_</span>
          </div>
          <div v-else-if="locStatus === 'done'" class="qc-result qc-result--ok">
            ✓ {{ locResult }}
          </div>
          <div v-else class="qc-result qc-result--err">✕ {{ locError }}</div>
        </div>

        <div class="qc-divider" />

        <!-- Photo -->
        <div class="qc-section">
          <div class="qc-section-label">02 — PHOTO</div>
          <div v-if="photoStatus === 'idle'" class="qc-row">
            <button class="qc-btn" @click="capturePhoto('CAMERA')">
              <q-icon name="photo_camera" size="14px" /> CAMERA
            </button>
            <button class="qc-btn" @click="capturePhoto('PHOTOLIBRARY')">
              <q-icon name="photo_library" size="14px" /> GALLERY
            </button>
          </div>
          <div v-else-if="photoStatus === 'loading'" class="qc-status">
            <span class="qc-blink">CAPTURING_</span>
          </div>
          <div v-else-if="photoStatus === 'done'" class="qc-result qc-result--ok">
            ✓ Photo captured &amp; saved
          </div>
          <div v-else class="qc-result qc-result--err">✕ {{ photoError }}</div>
        </div>

        <div class="qc-divider" />

        <!-- Notification -->
        <div class="qc-section">
          <div class="qc-section-label">03 — NOTIFICATION</div>
          <div v-if="notifStatus !== 'done'">
            <input
              v-model="notifMsg"
              class="qc-input"
              placeholder="Type message..."
              @keydown.enter="sendNotif"
            />
            <button
              class="qc-btn qc-btn--send"
              :disabled="!notifMsg.trim()"
              @click="sendNotif"
            >
              SEND →
            </button>
          </div>
          <div v-else class="qc-result qc-result--ok">✓ Notification logged</div>
        </div>

        <!-- Done -->
        <div class="qc-footer">
          <button class="qc-done-btn" @click="close">DONE</button>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePushNotifications } from '@/composables/usePushNotifications'

const open = ref(false)
const { logLocation, logPhoto, logNotification } = useApi()
const { scheduleLocal, permission, requestPermission } = usePushNotifications()

// ── Location ──────────────────────────────────────────────────────────────────
const locStatus = ref('idle')
const locResult = ref('')
const locError  = ref('')

async function captureLocation() {
  locStatus.value = 'loading'
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 15000, maximumAge: 0
      })
    )
    const { latitude, longitude, accuracy, altitude } = pos.coords

    let address = null
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      address = data.display_name ?? null
    } catch {}

    await logLocation({ latitude, longitude, accuracy, altitude }, address)
    locResult.value = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
    locStatus.value = 'done'
  } catch (e) {
    locError.value  = e.message ?? 'Permission denied'
    locStatus.value = 'error'
  }
}

// ── Photo ─────────────────────────────────────────────────────────────────────
const photoStatus = ref('idle')
const photoError  = ref('')

async function capturePhoto(source) {
  photoStatus.value = 'loading'
  try {
    const dataUrl = await pickFile(source)
    await logPhoto(dataUrl)
    photoStatus.value = 'done'
  } catch (e) {
    photoError.value  = e.message ?? 'Cancelled'
    photoStatus.value = 'error'
  }
}

function pickFile(source) {
  return new Promise((resolve, reject) => {
    // Native Cordova
    if (window.cordova && navigator.camera) {
      navigator.camera.getPicture(
        (b64) => resolve(b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`),
        reject,
        { quality: 80, destinationType: Camera.DestinationType.DATA_URL,
          sourceType: source === 'PHOTOLIBRARY' ? Camera.PictureSourceType.PHOTOLIBRARY : Camera.PictureSourceType.CAMERA,
          correctOrientation: true }
      )
      return
    }
    // Browser fallback
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    if (source === 'CAMERA') input.capture = 'environment'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { reject(new Error('No file selected')); return }
      const reader = new FileReader()
      reader.onload  = e => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Read failed'))
      reader.readAsDataURL(file)
    }
    input.oncancel = () => reject(new Error('Cancelled'))
    input.click()
  })
}

// ── Notification ──────────────────────────────────────────────────────────────
const notifStatus = ref('idle')
const notifMsg    = ref('')

async function sendNotif() {
  if (!notifMsg.value.trim()) return
  try {
    if (permission.value !== 'granted') await requestPermission()
    const title = notifMsg.value.trim()
    scheduleLocal(title, 'Sent via Quick Capture', 1000)
    await logNotification(title, 'Sent via Quick Capture', 'sent')
    notifStatus.value = 'done'
  } catch {
    notifStatus.value = 'error'
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function close() {
  open.value = false
  setTimeout(() => {
    locStatus.value = photoStatus.value = notifStatus.value = 'idle'
    locResult.value = locError.value = photoError.value = notifMsg.value = ''
  }, 200)
}
</script>

<style scoped>
.qc-fab {
  position: fixed; bottom: 80px; right: 16px;
  width: 52px; height: 52px;
  background: #000; color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 4px 4px 0 #555; z-index: 500; transition: all 0.15s;
}
.qc-fab:hover  { box-shadow: 6px 6px 0 #333 }
.qc-fab:active { transform: translate(4px,4px); box-shadow: none }

.qc-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center; padding-bottom: 72px;
}

.qc-panel {
  background: #fff; border: 2px solid #000; box-shadow: 6px 6px 0 #000;
  width: 100%; max-width: 480px;
  font-family: 'IBM Plex Mono', monospace;
  animation: slideUp 0.18s ease;
}
@keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

.qc-header { background: #000; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 10px 16px }
.qc-title  { font-size: 10px; font-weight: 700; letter-spacing: 2px }
.qc-close  { background: none; border: none; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'IBM Plex Mono', monospace }

.qc-section       { padding: 12px 16px }
.qc-section-label { font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #888; margin-bottom: 8px }
.qc-divider       { height: 1px; background: #e0e0e0 }
.qc-row           { display: flex; gap: 8px; flex-wrap: wrap }

.qc-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  border: 2px solid #000; background: #fff; color: #000;
  font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px;
  cursor: pointer; box-shadow: 2px 2px 0 #ccc; transition: all 0.1s;
}
.qc-btn:hover   { background: #f5f5f5 }
.qc-btn:active  { transform: translate(2px,2px); box-shadow: none }
.qc-btn:disabled{ opacity: 0.4; cursor: not-allowed }
.qc-btn--send   { margin-top: 8px; width: 100%; justify-content: center; background: #000; color: #fff; box-shadow: 3px 3px 0 #555 }
.qc-btn--send:hover { background: #222 }

.qc-input {
  width: 100%; border: 2px solid #000; padding: 8px 10px;
  font-family: 'IBM Plex Mono', monospace; font-size: 12px;
  outline: none; background: #fff; color: #000;
}
.qc-input:focus { box-shadow: 3px 3px 0 #000 }
.qc-input::placeholder { color: #aaa }

.qc-status { font-size: 11px; font-weight: 700; color: #888 }
.qc-blink  { animation: blink 1s step-end infinite }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

.qc-result     { font-size: 11px; font-weight: 700; padding: 6px 10px; border: 1px solid }
.qc-result--ok { background: #f5f5f5; border-color: #000; color: #000 }
.qc-result--err{ background: #fff; border-color: #ccc; color: #888 }

.qc-footer    { padding: 12px 16px; border-top: 2px solid #000 }
.qc-done-btn  {
  width: 100%; padding: 11px; background: #000; color: #fff; border: none;
  font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 2px;
  cursor: pointer; box-shadow: 3px 3px 0 #555; transition: all 0.1s;
}
.qc-done-btn:hover  { box-shadow: 5px 5px 0 #333 }
.qc-done-btn:active { transform: translate(3px,3px); box-shadow: none }
</style>