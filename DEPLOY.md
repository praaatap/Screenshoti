# Screenshoti — Deploy Guide

## Prerequisites

- Node 18+, Java 17 (Android), Xcode 15+ (iOS)
- Android Studio with SDK 36 + NDK 27
- React Native CLI: `npm install -g @react-native-community/cli`

---

## 1. Install dependencies

```bash
npm install
# iOS only
cd ios && pod install && cd ..
```

---

## 2. Environment setup

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Default | Purpose |
|---|---|---|
| `DEMO_MODE` | `true` | Seed 24 demo screenshots on first launch |
| `DEMO_SCREENSHOT_COUNT` | `24` | How many demo items to seed |
| `SYNC_SECRET` | see .env | XOR key for encrypted backup |
| `FEATURE_PIN_LOCK` | `true` | Enable PIN lock screen |
| `APP_ENV` | `development` | `production` disables demo mode defaults |

---

## 3. Run in development

```bash
# Start Metro
npm start

# Android
npm run android

# iOS
npm run ios
```

---

## 4. Build Android APK (debug)

```bash
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. Build Android APK (release)

### Generate a keystore (one-time)

```bash
keytool -genkeypair -v \
  -keystore screenshoti-release.keystore \
  -alias screenshoti \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

### Set keystore env vars

```bash
export KEYSTORE_PATH=/absolute/path/to/screenshoti-release.keystore
export KEYSTORE_PASSWORD=yourpassword
export KEY_ALIAS=screenshoti
export KEY_PASSWORD=yourkeypassword
```

### Build

```bash
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 6. Build Android AAB (Play Store)

```bash
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 7. iOS TestFlight

1. Open `ios/screenshoti.xcworkspace` in Xcode
2. Set signing team: Targets → screenshoti → Signing & Capabilities
3. Set scheme to **Release**
4. Product → Archive
5. Distribute App → App Store Connect → TestFlight

---

## 8. Demo mode

On first launch with `DEMO_MODE=true`, the app seeds 24 synthetic screenshots with realistic filenames, tags, albums, and notes. The seed flag is stored in AsyncStorage — clear it with:

```js
import {clearDemoSeedFlag} from './src/services/demo/demoSeed';
await clearDemoSeedFlag();
```

Or uninstall/reinstall the app.

---

## 9. PIN lock

- Set a PIN in Settings → Privacy & Security
- Enable "Lock on background" to require PIN when app returns from background
- PIN is stored in Zustand persist (AsyncStorage) — never in plain logs

---

## 10. react-native-config linking

`react-native-config` autlinks on RN 0.60+. After `npm install`:

- Android: the `apply from: dotenv.gradle` line in `android/app/build.gradle` is already present
- iOS: run `pod install` — the pod is auto-linked

If build fails with "project ':react-native-config' not found", run:

```bash
npx react-native link react-native-config
```

---

## 11. Deep links

### URL schemes supported

| URL | Opens |
|---|---|
| `screenshoti://screenshot/:id` | Detail screen for that screenshot |
| `screenshoti://album/:id/:name` | Album detail screen |
| `screenshoti://search` | Search screen |
| `https://app.screenshoti.app/screenshot/:id` | Same via HTTPS |
| `https://app.screenshoti.app/album/:id/:name` | Same via HTTPS |

### In-app sharing

From **Detail screen** action bar:
- **Share** — native share sheet with the image file
- **Link** — share a deep link URL to this exact screenshot
- **Export** — share as text summary (filename, date, tags, extracted text)
- **Text** — share extracted OCR text via system share sheet

From **Home** (multi-select mode):
- **Share** — share all selected images at once

From **Albums** (long-press → options sheet):
- **Share** — share album cover + link

### Receive images from other apps (Android)

Any app can share images to Screenshoti. The app is registered as a share target for `image/*`. After receiving, it refreshes the gallery automatically.

---

## Architecture snapshot

```
src/
  config/index.ts          — typed env config (AppConfig)
  services/
    demo/                  — seedData + demoSeed (first-launch seeding)
    sync/syncService.ts    — XOR-based encrypted backup
    intelligence/          — OCR indexing (optional)
    observability/         — analytics event tracking
  store/                   — Zustand stores (persist + AsyncStorage)
  screens/
    PinScreen.tsx          — numeric PIN pad with lock-on-background
    HomeScreen / Detail / Search / Settings ...
  navigation/RootNavigator.tsx — AppState listener → PinLock gate
  theme/tokens.ts          — zinc monochrome design tokens
  components/ui/           — Button, Badge, Chip, Toast, SectionCard
```
