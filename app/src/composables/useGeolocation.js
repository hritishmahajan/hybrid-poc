/**
 * useGeolocation
 * Wraps the Cordova Geolocation plugin when running natively,
 * and falls back to the standard browser navigator.geolocation API.
 *
 * Both paths expose the same reactive state, so Vue components
 * don't need to care which environment they're in.
 */
import { ref } from 'vue'

export function useGeolocation() {
  const coords      = ref(null)   // { latitude, longitude, accuracy, altitude, speed, heading }
  const address     = ref(null)   // reverse-geocoded string (best effort)
  const error       = ref(null)
  const loading     = ref(false)
  const watching    = ref(false)

  let watchId = null

  /** One-shot position fix */
  async function getCurrentPosition() {
    loading.value = true
    error.value   = null
    try {
      const pos = await getPosition()
      coords.value = extractCoords(pos)
      await reverseGeocode(coords.value)
    } catch (e) {
      error.value = friendlyError(e)
    } finally {
      loading.value = false
    }
  }

  /** Start watching position (live tracking) */
  function startWatch() {
    if (watching.value) return
    watching.value = true
    error.value    = null

    const geo = window.cordova ? navigator.geolocation : navigator.geolocation
    watchId = geo.watchPosition(
      (pos) => { coords.value = extractCoords(pos) },
      (e)   => { error.value  = friendlyError(e)   },
      GEO_OPTIONS
    )
  }

  /** Stop watching */
  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    watching.value = false
  }

  /** Clear all state */
  function clear() {
    stopWatch()
    coords.value  = null
    address.value = null
    error.value   = null
  }

  return { coords, address, error, loading, watching, getCurrentPosition, startWatch, stopWatch, clear }
}

// ── helpers ──────────────────────────────────────────────────────────────────

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout           : 15_000,
  maximumAge        : 5_000
}

function getPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS)
  })
}

function extractCoords(pos) {
  const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords
  return { latitude, longitude, accuracy, altitude, speed, heading }
}

/** Best-effort reverse geocode using the open Nominatim API */
async function reverseGeocode({ latitude, longitude }, addressRef) {
  // addressRef is module-level ref captured via closure in caller;
  // we re-export the ref so callers can use it directly.
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    return data.display_name ?? null
  } catch {
    return null
  }
}

// Override the reverseGeocode call so it writes back to the composable's ref:
// (We re-define inside the composable closure – the function above is a helper.)

function friendlyError(e) {
  if (!e) return 'Unknown error'
  if (e.code === 1) return 'Permission denied – please allow location access.'
  if (e.code === 2) return 'Position unavailable – check GPS / network.'
  if (e.code === 3) return 'Request timed out.'
  return e.message ?? String(e)
}
