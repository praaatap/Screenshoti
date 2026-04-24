# GEMINI.md - Screenshots Manager (Screenshoti)

This project is a high-performance, TypeScript-first screenshot organizer built with React Native CLI. It focuses on device-local organization, search, and smart categorization of screenshots.

## Project Overview

- **Purpose:** A mobile application to manage, tag, and intelligently organize device screenshots.
- **Main Technologies:**
  - **Framework:** React Native 0.85.2 (CLI)
  - **Language:** TypeScript
  - **State Management:** Zustand (with persistence via AsyncStorage)
  - **Navigation:** React Navigation (Stack + Bottom Tabs)
  - **Animation:** React Native Reanimated & Gesture Handler
  - **Native Access:** `@react-native-camera-roll/camera-roll` for media access, `react-native-permissions` for runtime permissions.
- **Key Features:**
  - **Media Loading:** Paginated loading from device gallery, filtered for likely screenshots.
  - **Organization:** Album management, favorites, and multi-tagging.
  - **Smart Features:** Keyword-based categorization (Receipts, Code, Design, etc.) and basic duplicate/similarity detection.
  - **Search:** Real-time filtering based on filename, tags, and notes.

## Architecture and Conventions

### Directory Structure
- `App.tsx`: Application entry point.
- `src/components/`: Shared UI components (ScreenshotCard, ScreenshotGrid, etc.).
- `src/features/`: Feature-scoped screens and logic (home, albums, search, etc.).
- `src/domain/`: Business logic for organization and smart grouping.
- `src/services/`: Background services for OCR indexing, analytics, and sync.
- `src/store/`: Zustand stores for screenshots, theme, filters, and intelligence.
- `src/navigation/`: Navigation structure and type definitions.
- `src/types/`: Centralized TypeScript interfaces.
- `src/utils/`: Formatting and screenshot utility functions.

### State Management (Zustand)
- Stores are located in `src/store/`.
- `useScreenshotStore`: Manages the list of screenshots, selection state, and persistence of user metadata (tags, notes, favorites).
- Persistence: User-defined metadata (tags, notes) is persisted via `AsyncStorage`, while raw media metadata is re-synchronized from the device gallery.

### Development Conventions
- **TypeScript:** Strict mode is preferred. Use defined types from `src/types/index.ts`.
- **Styling:** Vanilla StyleSheet with theme tokens from `src/theme/tokens.ts`.
- **Navigation:** Use the `RootStackParamList` and related ParamLists for type-safe navigation.
- **Testing:** Jest is used for unit and domain logic tests. Tests are located in `__tests__`.

## Building and Running

### Prerequisites
- Node.js 18+
- Android Studio / SDK (for Android builds)
- Xcode (for iOS builds, macOS only)

### Key Commands
- `npm start`: Starts the Metro bundler.
- `npm run android`: Builds and runs the app on an Android device/emulator.
- `npm run ios`: Builds and runs the app on an iOS device/simulator.
- `npm run lint`: Runs ESLint for code quality checks.
- `npm run test`: Executes Jest test suites.
- `cd ios && pod install`: (iOS only) Installs CocoaPods dependencies.

## Important Android Configuration (Native)
The project uses `react-native-async-storage` v3.0.0+, which requires a local Maven repository configuration in `android/settings.gradle`:

```gradle
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
        maven {
            url = uri("../node_modules/@react-native-async-storage/async-storage/android/local_repo")
        }
    }
}
```

## TODO / Future Improvements
- [ ] Re-introduce `useAsyncStorage` hook if needed by library updates.
- [ ] Implement deeper OCR using on-device models (currently uses metadata-based indexing).
- [ ] Enhanced duplicate cleanup logic.
