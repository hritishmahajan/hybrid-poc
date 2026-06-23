# HybridPOC

A proof-of-concept hybrid mobile app that demonstrates **Camera**, **Geolocation**, and **Push Notifications** running across browser, Android, and iOS from a single codebase — plus an admin dashboard to inspect all captured data in real time.

Built with Apache Cordova, Vue 3, Quasar, and a FastAPI backend. The whole thing runs locally in about 30 seconds.

---

## What this demonstrates

| Feature | Native (Cordova) | Browser fallback |
|---------|-----------------|-----------------|
| Camera | `cordova-plugin-camera` → base64 JPEG | `<input type="file" capture="environment">` |
| Geolocation | `cordova-plugin-geolocation` | `navigator.geolocation` |
| Push notifications | PhoneGap Push (FCM / APNs) | Web Notifications API |

All three features work in the browser during development — no phone or emulator needed to see them in action. The app automatically detects whether Cordova is available and falls back gracefully.

---

## Project layout

```
hybrid-poc-repo/
├── app/          # Vue 3 + Quasar frontend (Cordova shell)
└── server/       # FastAPI backend + admin dashboard
```

### `app/` — the mobile app

```
src/
├── main.js                     # boots after Cordova deviceready fires
├── App.vue                     # drawer + bottom tab layout
├── router/index.js             # hash-mode router (required for Cordova)
├── pages/
│   ├── HomePage.vue            # device info + feature list
│   ├── CameraPage.vue          # photo capture and gallery picker
│   ├── LocationPage.vue        # GPS coordinates, live watch, OSM map
│   └── NotifyPage.vue          # local and push notification demo
└── composables/
    ├── useCamera.js            # Cordova camera + browser file picker
    ├── useGeolocation.js       # GPS with Cordova / web fallback
    ├── useApi.js               # posts data silently to the backend
    └── usePushNotifications.js # PhoneGap Push + Web Notifications
```

### `server/` — FastAPI backend

```
main.py        # REST endpoints + admin dashboard route
database.py    # SQLAlchemy models (SQLite)
schemas.py     # Pydantic request/response schemas
admin.html     # single-file admin UI (no build step needed)
```

The backend stores every location ping, captured photo (as base64), and notification record. The admin dashboard at `/admin` lets you browse and delete everything.

---

## Running locally

### 1. Start the backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

Server starts at `http://localhost:8000`.
Admin dashboard: `http://localhost:8000/admin`
API docs (Swagger): `http://localhost:8000/docs`

### 2. Start the frontend

```bash
cd app
npm install
npm run dev
```

App opens at `http://localhost:5173`. Use the camera, grab your GPS, fire a notification — it all logs to the backend automatically.

> No API key is required on localhost. The server skips auth for local requests.

---

## Building for Android / iOS

### Prerequisites

- Android Studio + Android SDK + Java 17
- `cordova` CLI: `npm install -g cordova`
- (iOS) macOS + Xcode 15+

```bash
# Android debug APK
cd app && npm run build:android

# iOS (macOS only)
cd app && npm run build:ios
```

APK output: `app/cordova/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

---

## CI/CD

`.github/workflows/build.yml` runs on every push to `main`:

1. **Web build** — `npm run build` → uploads `www/` as an artifact
2. **Android** — installs Cordova platform, builds debug APK, uploads artifact
3. **iOS** — builds simulator `.app`, uploads artifact

---

## Tech stack

| Layer | Tech |
|-------|------|
| UI framework | Vue 3 (Composition API) |
| Component library | Quasar 2 |
| Bundler | Vite 5 |
| Native shell | Apache Cordova |
| Routing | Vue Router 4 (hash history) |
| Backend | FastAPI + SQLAlchemy |
| Database | SQLite |
| CI/CD | GitHub Actions |

---

## Cordova plugins

| Plugin | What it does |
|--------|-------------|
| `cordova-plugin-device` | Platform + model info on the home screen |
| `cordova-plugin-camera` | Photo capture and gallery access |
| `cordova-plugin-geolocation` | GPS coordinates and live position watch |
| `phonegap-plugin-push` | FCM (Android) and APNs (iOS) push registration |
| `cordova-plugin-local-notification` | Scheduled local alerts |

---

## Firebase push notifications (production setup)

1. Create a Firebase project and download `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
2. Replace `YOUR_FIREBASE_SENDER_ID` in `app/cordova/config.xml` with your FCM Sender ID
3. Place `google-services.json` in `app/cordova/platforms/android/app/`

---

## Environment variables

Create `app/.env.local` to point the frontend at a non-local server:

```
VITE_API_URL=https://your-server.example.com
VITE_API_KEY=hybridpoc-secret-2025
```

---

*Built by Hritish Mahajan*
