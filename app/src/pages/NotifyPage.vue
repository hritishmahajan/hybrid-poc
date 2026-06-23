<template>
  <q-page class="br-page">
    <div class="br-page-header anim-fade-up">
      <div class="br-page-eyebrow">FEATURE — 03</div>
      <div class="br-page-title">NOTIFICATIONS</div>
    </div>

    <!-- Permission -->
    <div class="br-perm-row anim-fade-up-1">
      <div class="br-perm-left">
        <span class="br-perm-tag" :class="`br-perm-tag--${permission}`">{{ permission.toUpperCase() }}</span>
        <span class="br-perm-label">{{ permLabel }}</span>
      </div>
      <button v-if="permission !== 'granted'" class="br-btn br-btn--sm" :disabled="loading" @click="handleEnable">
        {{ loading ? 'WAIT_' : 'ENABLE' }}
      </button>
    </div>

    <!-- Compose -->
    <div class="br-section-header anim-fade-up-2">
      <span class="br-section-num">01</span>
      <span class="br-section-title">COMPOSE</span>
    </div>
    <div class="br-compose anim-fade-up-2">
      <div class="br-field-row">
        <label class="br-field-label">TITLE</label>
        <input v-model="form.title" class="br-input" placeholder="Notification title" />
      </div>
      <div class="br-field-row">
        <label class="br-field-label">BODY</label>
        <textarea v-model="form.body" class="br-input br-textarea" rows="2" placeholder="Message body" />
      </div>
      <div class="br-field-row">
        <label class="br-field-label">DELAY</label>
        <div class="br-delay-row">
          <button
            v-for="opt in delayOptions" :key="opt.value"
            class="br-delay-btn"
            :class="{ 'br-delay-btn--active': form.delay === opt.value }"
            @click="form.delay = opt.value"
          >{{ opt.label }}</button>
        </div>
      </div>
      <button class="br-send-btn" :disabled="!form.title.trim()" @click="send">
        SCHEDULE · FIRES IN {{ form.delay / 1000 }}S →
      </button>
    </div>

    <!-- Pending -->
    <div v-if="pending.length">
      <div class="br-section-header anim-fade-up-3">
        <span class="br-section-num">02</span>
        <span class="br-section-title">PENDING ({{ pending.length }})</span>
      </div>
      <div class="br-pending-list">
        <div v-for="p in pending" :key="p.id" class="br-pending-row">
          <span class="br-pending-timer">T-{{ p.remaining }}S</span>
          <span class="br-pending-title">{{ p.title }}</span>
          <button class="br-pending-cancel" @click="cancelPending(p.id)">✕</button>
        </div>
      </div>
    </div>

    <!-- Feed -->
    <div class="br-section-header anim-fade-up-4">
      <span class="br-section-num">{{ pending.length ? '03' : '02' }}</span>
      <span class="br-section-title">FEED ({{ messages.length }})</span>
      <button v-if="messages.length" class="br-clear-btn" @click="clear">CLEAR ALL</button>
    </div>

    <div v-if="messages.length" class="br-feed">
      <div v-for="(msg, i) in messages" :key="msg.id" class="br-msg-row">
        <div class="br-msg-index">{{ String(i + 1).padStart(2, '0') }}</div>
        <div class="br-msg-body">
          <div class="br-msg-title">{{ msg.title }}</div>
          <div class="br-msg-text">{{ msg.body }}</div>
        </div>
        <div class="br-msg-time">{{ msg.at }}</div>
      </div>
    </div>
    <div v-else class="br-empty">
      <div class="br-empty-icon">[ BELL ]</div>
      <div class="br-empty-text">NO_MESSAGES</div>
      <div class="br-empty-sub">Schedule a notification above</div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { useApi } from '@/composables/useApi'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { permission, messages, loading, requestPermission, scheduleLocal, clear } = usePushNotifications()
const { logNotification } = useApi()
const form = ref({ title: 'HELLO FROM HYBRIDPOC', body: 'This is a test notification.', delay: 3000 })
const delayOptions = [{ label: '3S', value: 3000 }, { label: '5S', value: 5000 }, { label: '10S', value: 10000 }]
const pending = ref([])
const _timers = []

const permLabel = computed(() => ({
  granted: 'Notifications enabled', denied: 'Blocked — enable in settings',
  default: 'Permission not requested', unsupported: 'Not supported'
}[permission.value] ?? ''))

async function handleEnable() {
  const r = await requestPermission()
  if (r === 'denied') $q.notify({ message: 'PERMISSION_DENIED', color: 'grey-10', textColor: 'white' })
}

function send() {
  if (!form.value.title.trim()) return
  const id = Date.now(), delayMs = form.value.delay, title = form.value.title, body = form.value.body
  let remaining = delayMs / 1000
  pending.value.push({ id, title, remaining })
  const tick = setInterval(() => {
    const e = pending.value.find(p => p.id === id)
    if (!e) { clearInterval(tick); return }
    e.remaining--
    if (e.remaining <= 0) { clearInterval(tick); pending.value = pending.value.filter(p => p.id !== id) }
  }, 1000)
  _timers.push(tick)
  scheduleLocal(title, body, delayMs)
  logNotification(title, body, 'sent')
  $q.notify({ message: `SCHEDULED_T-${delayMs/1000}S`, color: 'grey-10', textColor: 'white' })
}

function cancelPending(id) { pending.value = pending.value.filter(p => p.id !== id) }
onUnmounted(() => _timers.forEach(clearInterval))
</script>

<style scoped>
.br-page { background: #fff; min-height: 100vh }
.br-page-header { border-bottom: 2px solid #000; padding: 16px }
.br-page-eyebrow { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #888; margin-bottom: 4px }
.br-page-title   { font-family: 'IBM Plex Mono',monospace; font-size: 2rem; font-weight: 700; color: #000; letter-spacing: -1px }

/* Permission */
.br-perm-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 2px solid #000; background: #f5f5f5 }
.br-perm-left { display: flex; align-items: center; gap: 10px; flex: 1 }
.br-perm-tag { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; padding: 3px 8px; flex-shrink: 0 }
.br-perm-tag--granted    { background: #000; color: #fff }
.br-perm-tag--denied     { background: #000; color: #fff }
.br-perm-tag--default    { background: #888; color: #fff }
.br-perm-tag--unsupported{ background: #ccc; color: #000 }
.br-perm-label { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #555 }
.br-btn--sm { font-family: 'IBM Plex Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: 1px; padding: 8px 12px; border: 2px solid #000; background: #000; color: #fff; cursor: pointer; box-shadow: 2px 2px 0 #555 }
.br-btn--sm:disabled { opacity: 0.4; cursor: not-allowed }
.br-btn--sm:active { transform: translate(2px,2px); box-shadow: none }

/* Section header */
.br-section-header { display: flex; align-items: center; gap: 10px; background: #000; padding: 8px 16px }
.br-section-num   { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; color: #666 }
.br-section-title { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #fff; flex: 1 }
.br-clear-btn { font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1px; background: none; border: 1px solid #555; color: #888; padding: 3px 8px; cursor: pointer }
.br-clear-btn:hover { border-color: #fff; color: #fff }

/* Compose */
.br-compose { border-bottom: 2px solid #000; padding: 14px 16px }
.br-field-row { margin-bottom: 10px }
.br-field-label { display: block; font-family: 'IBM Plex Mono',monospace; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; color: #888; margin-bottom: 5px }
.br-input { width: 100%; font-family: 'IBM Plex Mono',monospace; font-size: 12px; font-weight: 400; color: #000; border: 2px solid #000; padding: 8px 10px; outline: none; background: #fff; transition: box-shadow 0.1s; resize: none }
.br-input:focus { box-shadow: 3px 3px 0 #000 }
.br-textarea { min-height: 52px }
.br-delay-row { display: flex; gap: 0 }
.br-delay-btn { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 8px 16px; border: 2px solid #000; border-right: none; background: #fff; color: #888; cursor: pointer; transition: all 0.1s }
.br-delay-btn:last-child { border-right: 2px solid #000 }
.br-delay-btn--active { background: #000; color: #fff }
.br-send-btn { width: 100%; margin-top: 12px; font-family: 'IBM Plex Mono',monospace; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 12px; border: 2px solid #000; background: #000; color: #fff; cursor: pointer; box-shadow: 4px 4px 0 #555; transition: all 0.1s }
.br-send-btn:hover { box-shadow: 6px 6px 0 #333 }
.br-send-btn:active { transform: translate(4px,4px); box-shadow: none }
.br-send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none }

/* Pending */
.br-pending-list { border-bottom: 2px solid #000 }
.br-pending-row { display: flex; align-items: center; gap: 0; border-bottom: 1px solid #e0e0e0 }
.br-pending-row:last-child { border-bottom: none }
.br-pending-timer { font-family: 'IBM Plex Mono',monospace; font-size: 11px; font-weight: 700; color: #fff; background: #000; padding: 12px 12px; min-width: 60px; text-align: center }
.br-pending-title { flex: 1; font-family: 'IBM Plex Mono',monospace; font-size: 11px; color: #000; padding: 0 14px }
.br-pending-cancel { font-family: 'IBM Plex Mono',monospace; font-size: 12px; font-weight: 700; background: none; border: none; color: #888; cursor: pointer; padding: 12px 14px; border-left: 1px solid #e0e0e0 }
.br-pending-cancel:hover { color: #000 }

/* Feed */
.br-feed { border-bottom: 2px solid #000 }
.br-msg-row { display: flex; align-items: flex-start; border-bottom: 1px solid #e0e0e0 }
.br-msg-row:last-child { border-bottom: none }
.br-msg-index { font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; color: #fff; background: #000; padding: 14px 12px; min-width: 40px; text-align: center }
.br-msg-body  { flex: 1; padding: 12px 14px }
.br-msg-title { font-family: 'IBM Plex Mono',monospace; font-size: 12px; font-weight: 700; color: #000 }
.br-msg-text  { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #888; margin-top: 3px }
.br-msg-time  { font-family: 'IBM Plex Mono',monospace; font-size: 9px; color: #888; padding: 14px 12px; flex-shrink: 0 }

/* Empty */
.br-empty { padding: 48px 16px; text-align: center }
.br-empty-icon { font-family: 'IBM Plex Mono',monospace; font-size: 2rem; font-weight: 700; color: #ccc; margin-bottom: 12px }
.br-empty-text { font-family: 'IBM Plex Mono',monospace; font-size: 13px; font-weight: 700; color: #000; margin-bottom: 6px }
.br-empty-sub  { font-family: 'IBM Plex Mono',monospace; font-size: 10px; color: #888 }
</style>