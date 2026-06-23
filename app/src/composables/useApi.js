// Posts location, photo, and notification events to the backend.
// Designed to fail silently — the app works fine offline, the server is just bonus.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_KEY  = import.meta.env.VITE_API_KEY  || 'hybridpoc-secret-2025'

// Persist a device ID so the admin panel can tell devices apart across sessions
const DEVICE_ID = (() => {
  let id = localStorage.getItem('device_id')
  if (!id) { id = 'browser-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('device_id', id) }
  return id
})()

async function post(path, body) {
  try {
    await fetch(`${BASE_URL}${path}`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body   : JSON.stringify({ ...body, device_id: DEVICE_ID })
    })
  } catch (e) {
    console.warn('[API] Could not reach server:', e.message)
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
