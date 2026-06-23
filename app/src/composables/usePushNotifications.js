/**
 * usePushNotifications — Singleton composable
 *
 * State is module-level, so it persists across tab switches and
 * component mounts/unmounts. All instances share the same reactive refs.
 *
 * Native  → cordova-plugin-push + cordova-plugin-local-notification
 * Browser → Web Notifications API
 */
import { ref, computed, readonly } from 'vue'

// ── Module-level singleton state ─────────────────────────────────────────────
// Defined outside the function so they survive component unmount/remount.

const _permission  = ref(_readPermission())
const _messages    = ref(_loadMessages())   // persisted to sessionStorage
const _pushObj     = ref(null)
const _initialized = ref(false)
const _loading     = ref(false)

// ── Helpers ───────────────────────────────────────────────────────────────────

function _readPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission ?? 'default'
}

function _loadMessages() {
  try {
    return JSON.parse(sessionStorage.getItem('notif_messages') ?? '[]')
  } catch {
    return []
  }
}

function _saveMessages() {
  try {
    // Keep only last 20 to avoid sessionStorage bloat
    sessionStorage.setItem('notif_messages', JSON.stringify(_messages.value.slice(0, 20)))
  } catch { /* storage full — ignore */ }
}

function _addMessage(title, body) {
  _messages.value.unshift({
    id   : Date.now(),
    title: title ?? 'Notification',
    body : body  ?? '',
    at   : new Date().toLocaleTimeString()
  })
  _saveMessages()
}

// Sync permission state if user changes it externally (e.g. in browser settings)
if (typeof window !== 'undefined') {
  // Permissions API lets us watch for changes without polling
  navigator.permissions?.query({ name: 'notifications' }).then(status => {
    status.onchange = () => { _permission.value = _readPermission() }
  }).catch(() => {})
}

// ── Cordova push init (called once) ──────────────────────────────────────────

function _initCordovaPush() {
  if (_initialized.value || !window.PushNotification) return
  _initialized.value = true

  const push = window.PushNotification.init({
    android: { senderID: 'YOUR_FIREBASE_SENDER_ID' },
    ios    : { alert: true, badge: true, sound: true },
    windows: {}
  })

  push.on('registration', (data) => {
    console.log('[Push] Token:', data.registrationId)
    _pushObj.value   = push
    _permission.value = 'granted'
  })

  push.on('notification', (data) => {
    _addMessage(data.title, data.message ?? data.additionalData?.body)
  })

  push.on('error', (err) => {
    console.error('[Push] Error:', err)
    _permission.value = 'denied'
    _initialized.value = false  // allow retry
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

async function requestPermission() {
  if (_loading.value) return _permission.value  // prevent double-tap
  _loading.value = true

  try {
    if (window.PushNotification) {
      _initCordovaPush()
      return _permission.value
    }

    if (typeof Notification === 'undefined') {
      throw new Error('Notifications not supported in this browser')
    }

    const result = await Notification.requestPermission()
    _permission.value = result
    return result
  } finally {
    _loading.value = false
  }
}

function scheduleLocal(title, body, delayMs = 3000) {
  // Capture values immediately so they're safe even if component unmounts
  const t = String(title)
  const b = String(body)
  const d = Number(delayMs)

  if (window.cordova && window.plugin?.notification?.local) {
    // Native Cordova local notification
    window.plugin.notification.local.schedule({
      id     : Date.now(),
      title  : t,
      text   : b,
      trigger: { in: Math.round(d / 1000), unit: 'second' }
    })
    // Also add to in-app feed after the same delay
    setTimeout(() => _addMessage(t, b), d)

  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    // Browser Web Notification API
    setTimeout(() => {
      try {
        const n = new Notification(t, { body: b, icon: '/icon.png' })
        setTimeout(() => n.close(), 6000)
      } catch (e) {
        console.warn('[Push] Notification failed:', e)
      }
      _addMessage(t, b)
    }, d)

  } else {
    // Fallback: in-app feed only (permission not granted / unsupported)
    setTimeout(() => _addMessage(t, b), d)
  }
}

function clearMessages() {
  _messages.value = []
  sessionStorage.removeItem('notif_messages')
}

// ── Composable export ─────────────────────────────────────────────────────────

export function usePushNotifications() {
  const isSupported = computed(() =>
    !!window.PushNotification || typeof Notification !== 'undefined'
  )

  // Auto-init Cordova push if already available (e.g. revisiting tab)
  if (window.PushNotification && !_initialized.value) {
    _initCordovaPush()
  }

  return {
    // Expose as readonly so components can't mutate directly
    permission : readonly(_permission),
    messages   : readonly(_messages),
    loading    : readonly(_loading),
    isSupported,
    requestPermission,
    scheduleLocal,
    clear: clearMessages
  }
}