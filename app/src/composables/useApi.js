// Posts location, photo, and notification events to the backend.
// BASE_URL is read from localStorage so it can be set from the app UI at runtime.
// Falls back to the build-time env var, then the production Vercel backend.

const API_KEY = import.meta.env.VITE_API_KEY || 'hybridpoc-secret-2025'

function getBaseUrl() {
  return localStorage.getItem('server_url') ||
         import.meta.env.VITE_API_URL ||
         'https://hybrid-poc-server.vercel.app'
}

export function setServerUrl(url) {
  localStorage.setItem('server_url', url.replace(/\/$/, ''))
}

export function getServerUrl() {
  return getBaseUrl()
}

// Persist a device ID so the admin panel can tell devices apart across sessions
const DEVICE_ID = (() => {
  let id = localStorage.getItem('device_id')
  if (!id) { id = 'device-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('device_id', id) }
  return id
})()

async function post(path, body) {
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body   : JSON.stringify({ ...body, device_id: DEVICE_ID })
    })
    return res.ok
  } catch (e) {
    console.warn('[API] Could not reach server:', e.message)
    return false
  }
}

export async function pingServer() {
  try {
    const res = await fetch(`${getBaseUrl()}/health`, { signal: AbortSignal.timeout(4000) })
    return res.ok
  } catch {
    return false
  }
}

export function useApi() {
  function logLocation(coords, address) {
    return post('/api/locations', {
      latitude : coords.latitude,
      longitude: coords.longitude,
      accuracy : coords.accuracy,
      altitude : coords.altitude,
      address  : address ?? null
    })
  }

  function logPhoto(dataUrl) {
    return post('/api/photos', { data_url: dataUrl })
  }

  function logNotification(title, body, status = 'sent') {
    return post('/api/notifications', { title, body, status })
  }

  return { logLocation, logPhoto, logNotification }
}
