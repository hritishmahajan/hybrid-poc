# HybridPOC – Cordova + Vue 3 + Quasar

> Cross-platform hybrid mobile app POC demonstrating Camera, Geolocation, and Push Notifications using Apache Cordova with a Vue 3 + Quasar frontend, bundled by Vite and deployed via GitHub Actions CI/CD.

---

## Stack

| Layer       | Tech                                |
|-------------|-------------------------------------|
| UI          | **Quasar 2** (Material Design)      |
| JS Framework| **Vue 3** (Composition API)         |
| Bundler     | **Vite 5**                          |
| Native Shell| **Apache Cordova**                  |
| Routing     | Vue Router 4 (hash history)         |
| CI/CD       | GitHub Actions                      |

---

## Project Structure

```
hybrid-poc/
├── src/
│   ├── main.js               # App entry – boots after Cordova deviceready
│   ├── App.vue               # Layout shell (drawer + bottom tabs)
│   ├── router/index.js       # Hash-history router (Cordova-safe)
│   ├── pages/
│   │   ├── HomePage.vue      # Dashboard + device info
│   │   ├── CameraPage.vue    # Photo capture / gallery pick
│   │   ├── LocationPage.vue  # GPS + live watch + OSM map
│   │   └── NotifyPage.vue    # Push/local notification demo
│   ├── composables/
│   │   ├── useCamera.js          # Cordova Camera plugin + browser fallback
│   │   ├── useGeolocation.js     # Cordova Geolocation + browser fallback
│   │   └── usePushNotifications.js  # PhoneGap Push + Web Notification API
│   └── assets/
│       └── quasar-variables.sass
├── cordova/
│   ├── config.xml            # Cordova app config + plugin declarations
│   └── www/                  # ← Vite build output lands here
├── .github/workflows/
│   └── build.yml             # CI: web build → Android APK → iOS .app
├── vite.config.js
└── package.json
```

---

## Quick Start (Browser dev mode)

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server (hot-reload, browser mode)
npm run dev
# → http://localhost:5173
```

All device features work in the browser via fallbacks:
- **Camera** → `<input type="file">` (or `capture="environment"` on mobile browsers)
- **Geolocation** → browser `navigator.geolocation` API
- **Notifications** → Web Notifications API (HTTPS / localhost only)

---

## Building for Android

### Prerequisites
- [Android Studio](https://developer.android.com/studio) + Android SDK
- Java 17 (`JAVA_HOME` set)
- `cordova` CLI: `npm install -g cordova`

```bash
# Build Vite bundle → www/, then build debug APK
npm run build:android

# Or: run directly on connected device
npm run run:android

# Or: run on emulator
npm run emulate:android
```

APK output: `cordova/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Building for iOS

### Prerequisites
- macOS with Xcode 15+
- Apple Developer account (for device builds)

```bash
npm run build:ios
# For simulator:
npm run emulate:android   # (same pattern for ios)
```

---

## Cordova Plugins Used

| Plugin | Feature |
|--------|---------|
| `cordova-plugin-device` | Platform / model info on Home screen |
| `cordova-plugin-camera` | Photo capture + gallery pick |
| `cordova-plugin-geolocation` | GPS coordinates + live watch |
| `phonegap-plugin-push` | FCM (Android) / APNs (iOS) push registration |
| `cordova-plugin-local-notification` | OS-level scheduled local alerts |

---

## CI/CD (GitHub Actions)

`.github/workflows/build.yml` runs on every push to `main`:

1. **Web Build** – `npm run build` → uploads `www/` as artifact
2. **Android** – downloads `www/`, adds Cordova Android platform, builds debug APK, uploads artifact
3. **iOS** – downloads `www/`, adds Cordova iOS platform, builds simulator `.app`, uploads artifact

---

## Configuration

### Firebase Push (Production)
1. Create a Firebase project → get `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
2. Replace `YOUR_FIREBASE_SENDER_ID` in `cordova/config.xml` with your FCM Sender ID
3. Place `google-services.json` in `cordova/platforms/android/app/`

### App Identity
Edit `cordova/config.xml`:
```xml
<widget id="com.yourcompany.yourapp" version="1.0.0">
  <name>Your App Name</name>
```
