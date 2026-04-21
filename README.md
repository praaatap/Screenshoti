# Screenshot Manager (React Native CLI)

A TypeScript-first screenshot organizer built with React Native CLI, Zustand, React Navigation, and device gallery integration.

## Tech Stack

- React Native CLI (no Expo)
- TypeScript strict mode
- Zustand state management with `create<T>()`
- React Navigation (stack + bottom tabs)
- React Native Reanimated + Gesture Handler
- CameraRoll integration for real-device screenshot loading

## Features

- Home screenshot grid with search, pull-to-refresh, and multi-select mode
- Animated bottom action bar for delete, move, and share actions
- Detail view with full-screen image viewer, swipe navigation, metadata, and tags
- Album management with create, rename, delete, and album detail browsing
- Favorites tab with filtered screenshot grid
- Full search screen with tag chips and real-time filtering
- Settings with dark mode, duplicate cleanup toggle, cache clear, and app version
- Loading skeletons, empty states, and retryable error states

## Project Structure

```text
src/
	assets/
	components/
	hooks/
	navigation/
	screens/
	store/
	types/
	utils/
App.tsx
```

## Requirements

- Node.js 18+
- Android Studio for Android builds
- Xcode + CocoaPods for iOS builds (macOS only)

## Installation

```bash
npm install
```

## iOS Setup

After installing JavaScript dependencies, install CocoaPods dependencies:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

## Run the App

Start Metro:

```bash
npm start
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

## Permissions

- Android: `READ_MEDIA_IMAGES` (Android 13+) and `READ_EXTERNAL_STORAGE` (API 32 and below)
- iOS: `NSPhotoLibraryUsageDescription` and `NSPhotoLibraryAddUsageDescription`

Permissions are requested at runtime via `react-native-permissions`.

## Scripts

- `npm run android` - run Android app
- `npm run ios` - run iOS app
- `npm run start` - start Metro bundler
- `npm run lint` - lint project
- `npm run test` - run Jest tests

## Notes

- Screenshot loading is handled in the Zustand screenshot store through CameraRoll.
- Filtering and sorting logic lives in `src/hooks/useFilteredScreenshots.ts`.
- Theme and app settings are managed by `src/store/useThemeStore.ts`.
