// Wraps the Cordova Camera plugin when running natively,
// and falls back to a hidden file input on the web.
import { ref } from 'vue'

export function useCamera() {
  const photoDataUrl = ref(null)
  const error       = ref(null)
  const loading     = ref(false)

  async function capture(source = 'CAMERA') {
    error.value   = null
    loading.value = true

    try {
      if (window.cordova && navigator.camera) {
        photoDataUrl.value = await new Promise((resolve, reject) => {
          const sourceType = source === 'PHOTOLIBRARY'
            ? Camera.PictureSourceType.PHOTOLIBRARY
            : Camera.PictureSourceType.CAMERA

          navigator.camera.getPicture(resolve, reject, {
            quality           : 80,
            destinationType   : Camera.DestinationType.DATA_URL,
            sourceType,
            encodingType      : Camera.EncodingType.JPEG,
            mediaType         : Camera.MediaType.PICTURE,
            correctOrientation: true,
            saveToPhotoAlbum  : false
          })
        })
        // Cordova returns raw base64, we need the full data URI
        if (!photoDataUrl.value.startsWith('data:')) {
          photoDataUrl.value = `data:image/jpeg;base64,${photoDataUrl.value}`
        }
      } else {
        photoDataUrl.value = await pickFileBrowser(source)
      }
    } catch (e) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  function clear() {
    photoDataUrl.value = null
    error.value        = null
  }

  return { photoDataUrl, error, loading, capture, clear }
}

function pickFileBrowser(source) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type   = 'file'
    input.accept = 'image/*'
    if (source === 'CAMERA') input.capture = 'environment' // opens camera on mobile browsers

    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { reject(new Error('No file selected')); return }

      const reader = new FileReader()
      reader.onload  = e => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsDataURL(file)
    }

    input.oncancel = () => reject(new Error('Cancelled'))
    input.click()
  })
}
