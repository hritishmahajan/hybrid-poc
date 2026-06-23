<template>
  <q-page class="br-page">
    <div class="br-page-header anim-fade-up">
      <div class="br-page-eyebrow">FEATURE — 01</div>
      <div class="br-page-title">CAMERA</div>
    </div>

    <!-- Actions -->
    <div class="br-action-bar anim-fade-up-1">
      <button class="br-btn br-btn--primary" :disabled="loading" @click="captureWithTime('CAMERA')">
        <q-icon name="photo_camera" size="16px" />
        <span>TAKE PHOTO</span>
      </button>
      <button class="br-btn br-btn--secondary" :disabled="loading" @click="captureWithTime('PHOTOLIBRARY')">
        <q-icon name="photo_library" size="16px" />
        <span>GALLERY</span>
      </button>
      <button v-if="photoDataUrl" class="br-btn br-btn--ghost" @click="clear">
        <q-icon name="delete" size="16px" />
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="br-error anim-fade-up">
      <span class="br-error-tag">ERR</span>
      <span class="br-error-msg">{{ error }}</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="br-loading anim-fade-up">
      <span class="br-loading-text">CAPTURING_</span>
    </div>

    <!-- Photo -->
    <div v-else-if="photoDataUrl" class="br-photo-wrap anim-fade-up-2">
      <div class="br-photo-meta">
        <span class="br-meta-label">CAPTURED</span>
        <span class="br-meta-val">{{ captureTime }}</span>
      </div>
      <img :src="photoDataUrl" class="br-photo-img" />
      <div class="br-photo-actions">
        <button class="br-photo-btn" @click="downloadPhoto">
          <q-icon name="download" size="16px" /> SAVE
        </button>
        <button class="br-photo-btn" @click="sharePhoto">
          <q-icon name="share" size="16px" /> SHARE
        </button>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="br-empty anim-fade-up-2">
      <div class="br-empty-icon">[ CAM ]</div>
      <div class="br-empty-text">NO_IMAGE_CAPTURED</div>
      <div class="br-empty-sub">Tap TAKE PHOTO to begin</div>
    </div>

    <!-- Info -->
    <div class="br-info-block anim-fade-up-3">
      <div class="br-info-row">
        <span class="br-info-key">NATIVE</span>
        <span class="br-info-val">cordova-plugin-camera → base64 JPEG</span>
      </div>
      <div class="br-info-row">
        <span class="br-info-key">BROWSER</span>
        <span class="br-info-val">input[type=file] capture=environment</span>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { useApi } from '@/composables/useApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { photoDataUrl, error, loading, capture, clear } = useCamera()
const { logPhoto } = useApi()
const captureTime = ref('--:--:--')

const _capture = capture
async function captureWithTime(src) {
  await _capture(src)
  captureTime.value = new Date().toLocaleTimeString()
  if (photoDataUrl.value) logPhoto(photoDataUrl.value)
}

function downloadPhoto() {
  if (!photoDataUrl.value) return
  const a = document.createElement('a'); a.href = photoDataUrl.value; a.download = `photo-${Date.now()}.jpg`; a.click()
  $q.notify({ message: 'SAVED', color: 'grey-10', textColor: 'white' })
}
async function sharePhoto() {
  if (!photoDataUrl.value) return
  if (navigator.share) {
    const blob = await fetch(photoDataUrl.value).then(r => r.blob())
    await navigator.share({ title: 'Photo', files: [new File([blob], 'photo.jpg', { type: 'image/jpeg' })] })
  } else {
    $q.notify({ message: 'SHARE_NOT_SUPPORTED', color: 'grey-10', textColor: 'white' })
  }
}
</script>

<style scoped>
.br-page { background: #fff; min-height: 100vh }

.br-page-header { border-bottom: 2px solid #000; padding: 16px }
.br-page-eyebrow { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #888; margin-bottom: 4px }
.br-page-title   { font-family: 'IBM Plex Mono',monospace; font-size: 2rem; font-weight: 700; color: #000; letter-spacing: -1px }

.br-action-bar { display: flex; gap: 0; border-bottom: 2px solid #000; padding: 14px 16px; gap: 8px }
.br-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 14px;
  font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px;
  border: 2px solid #000; cursor: pointer; transition: all 0.1s;
}
.br-btn:active { transform: translate(2px,2px); box-shadow: none !important }
.br-btn:disabled { opacity: 0.4; cursor: not-allowed }
.br-btn--primary   { background: #000; color: #fff; box-shadow: 3px 3px 0 #555; flex: 1 }
.br-btn--secondary { background: #fff; color: #000; box-shadow: 3px 3px 0 #ccc }
.br-btn--ghost     { background: #fff; color: #000; border-color: #000; box-shadow: 3px 3px 0 #ccc }

.br-error { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 2px solid #000; background: #fff }
.br-error-tag { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; background: #000; color: #fff; padding: 3px 7px }
.br-error-msg { font-family: 'IBM Plex Mono',monospace; font-size: 11px; color: #000 }

.br-loading { padding: 40px 16px; text-align: center; border-bottom: 2px solid #000 }
.br-loading-text { font-family: 'IBM Plex Mono',monospace; font-size: 14px; font-weight: 700; color: #000; animation: blink 1s step-end infinite }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

.br-photo-wrap { border-bottom: 2px solid #000 }
.br-photo-meta { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid #e0e0e0; background: #f5f5f5 }
.br-meta-label { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #888 }
.br-meta-val   { font-family: 'IBM Plex Mono',monospace; font-size: 11px; font-weight: 700; color: #000 }
.br-photo-img  { width: 100%; max-height: 340px; object-fit: contain; display: block; background: #f0f0f0; border-bottom: 1px solid #e0e0e0 }
.br-photo-actions { display: flex }
.br-photo-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px; background: #fff; border: none; border-right: 1px solid #e0e0e0;
  font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; cursor: pointer;
  transition: background 0.1s; color: #000;
}
.br-photo-btn:last-child { border-right: none }
.br-photo-btn:hover { background: #f0f0f0 }

.br-empty { padding: 48px 16px; text-align: center; border-bottom: 2px solid #000 }
.br-empty-icon { font-family: 'IBM Plex Mono',monospace; font-size: 2rem; font-weight: 700; color: #ccc; margin-bottom: 12px }
.br-empty-text { font-family: 'IBM Plex Mono',monospace; font-size: 13px; font-weight: 700; color: #000; margin-bottom: 6px }
.br-empty-sub  { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #888 }

.br-info-block { padding: 14px 16px; background: #f5f5f5; border-top: 2px solid #000 }
.br-info-row { display: flex; gap: 14px; margin-bottom: 6px }
.br-info-row:last-child { margin-bottom: 0 }
.br-info-key { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: 1px; background: #000; color: #fff; padding: 2px 6px; flex-shrink: 0; align-self: flex-start }
.br-info-val { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #555 }
</style>