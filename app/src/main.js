import { createApp } from 'vue'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '@/assets/global.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(Quasar, {
  plugins: { Notify, Dialog, Loading },
  config: {
    notify: { position: 'top', timeout: 2500 },
    loading: { message: 'Please wait…', spinnerColor: 'primary' }
  }
})

app.use(router)

// Wait for Cordova deviceready on native, boot immediately in browser
const boot = () => app.mount('#app')

if (window.cordova) {
  document.addEventListener('deviceready', boot, false)
} else {
  boot()
}