# Detailed Issue Tracker & Technical Debt Log

This document provides a detailed breakdown of the 31+ technical debt items and bugs currently present in the Screenshoti codebase. It is designed for personal review and prioritizing future development sprints.

---

## Part 1: Code Quality & ESLint Warnings

These issues are currently flagged by the linter and should be resolved to maintain a clean codebase.

**1. Inline Styles (`react-native/no-inline-styles`)**
- **Detail:** Numerous components use inline styles which bypass the React Native stylesheet optimization bridge.
- **Affected Files:** `BottomActionBar.tsx`, `ScreenshotCard.tsx`, `ScreenshotGrid.tsx`, `Badge.tsx`, `Button.tsx`, `Chip.tsx`, `ConfirmationSheet.tsx`, `SectionCard.tsx`, `Toast.tsx`, `SettingsScreen.tsx`, `HomeScreen.tsx`, `DetailScreen.tsx`.
- **Action:** Extract all `style={{...}}` declarations into `StyleSheet.create` blocks at the bottom of their respective files. Dynamic styles can be computed using style arrays.

**2. React Hooks Dependencies (`react-hooks/exhaustive-deps`)**
- **Detail:** Missing or unnecessary dependencies in hooks can lead to stale closures or infinite re-render loops.
- **Affected Files:** 
  - `src/components/ShimmerSkeleton.tsx` (missing `translateX` in `useEffect`).
  - `src/hooks/usePermissions.ts` (unnecessary dependency `checkPermissionSilently` in `useCallback`).
  - `src/screens/HomeScreen.tsx` (missing `showToast` in `useCallback`).
- **Action:** Update the dependency arrays. If a dependency shouldn't trigger a re-run, use a `useRef` to store the latest value instead of removing the dependency.

**3. Unused Variables (`@typescript-eslint/no-unused-vars`)**
- **Detail:** Dead code clutters the repository.
- **Affected Files:** `ScreenshotCard.tsx`, `DetailScreen.tsx` (unused `useCallback` imports), `usePermissions.ts` (unused `checkMultiple`), `screenshotUtils.ts` (unused `uri` argument).
- **Action:** Remove these declarations.

**4. Unstable Nested Components (`react/no-unstable-nested-components`)**
- **Detail:** Defining components inside other components' render functions causes React to destroy and recreate the DOM nodes on every render, ruining performance and resetting local state.
- **Affected Files:** `src/navigation/RootNavigator.tsx` (specifically the `headerRight` function in `Detail` screen options and potentially custom tab bar icons).
- **Action:** Move the component definitions outside of the main component scope or use `React.useCallback` for simple render props if strictly necessary.

**5. Object Notation (`dot-notation`)**
- **Detail:** Accessing object properties via brackets (e.g., `obj["Today"]`) when valid identifiers exist.
- **Affected Files:** `useFilteredScreenshots.ts`.
- **Action:** Change `["Today"]` to `.Today` (if the type allows, though for dynamic dictionary keys, bracket notation might actually be correct; verify TS types).

**6. Bitwise Operators (`no-bitwise`)**
- **Detail:** Accidental use of bitwise XOR `^` instead of logical operators or `Math.pow`.
- **Affected Files:** `syncService.ts`.
- **Action:** Review line 15 in `syncService.ts` and correct the operator.

**7. Unhandled Promises (`no-void`)**
- **Detail:** Promises are floating without being `await`ed or explicitly marked as intentionally unhandled.
- **Affected Files:** Heavily prevalent in `usePermissions.ts`, `DetailScreen.tsx`, `FavoritesScreen.tsx`, `HomeScreen.tsx`, `SearchScreen.tsx`, `SettingsScreen.tsx`.
- **Action:** Use `void someAsyncFunction()` to explicitly state the promise is intentionally not awaited, or properly `await` it inside an async function.

**8. ESLint Directive Cleanup**
- **Detail:** Unnecessary disable comments.
- **Affected Files:** `analytics.ts` (`eslint-comments/no-unused-disable`).
- **Action:** Remove the comment.

---

## Part 2: Performance Optimization

**9. `ScreenshotGrid` & List Re-renders**
- **Detail:** Currently, selecting a single screenshot likely triggers a re-render of the entire `FlatList` because `selectedIds` is passed down and changes on every tap.
- **Action:** Memoize `ScreenshotCard` with a custom `arePropsEqual` function that only re-renders if *its specific ID* is added or removed from `selectedIds`.

**10. FlatList Bottlenecks**
- **Detail:** Large galleries will cause memory issues.
- **Action:** Tweak `FlatList` props (`windowSize`, `maxToRenderPerBatch`, `initialNumToRender`) to find the sweet spot for performance vs. blank space when scrolling rapidly.

**11. Image Memory Bloat**
- **Detail:** Standard `<Image>` components keep decoded bitmaps in memory.
- **Action:** Migrate to `react-native-fast-image` (or Expo Image if using Expo) to heavily optimize memory usage and caching for hundreds of thumbnails.

**12. JS Thread Animation Blocking**
- **Detail:** Animations running on the JS thread can cause stuttering.
- **Action:** Verify all `Animated` and `Reanimated` uses in `ShimmerSkeleton.tsx` and `BottomActionBar.tsx` are using the UI thread.

**13. Zustand Store Size**
- **Detail:** `useScreenshotStore` is getting large.
- **Action:** Consider splitting it to prevent unnecessary re-renders in components that only care about a small slice of state.

---

## Part 3: UI, UX, and Bug Fixes

**14. Android Keyboard Avoidance**
- **Detail:** Text inputs in `DetailScreen` (tags, notes) and `SearchScreen` might be covered by the keyboard on some Android devices.
- **Action:** Tweak `KeyboardAvoidingView` offsets or use `react-native-keyboard-aware-scroll-view`.

**15. Dark Mode Flash**
- **Detail:** Potential flash of unstyled content or wrong colors when the app mounts before the theme store is fully hydrated from AsyncStorage.
- **Action:** Add a splash screen hold until Zustand completes rehydration.

**16. Accessibility (a11y)**
- **Detail:** Screen readers might struggle with custom icon buttons.
- **Action:** Ensure every icon-only `Pressable` has a descriptive `accessibilityLabel`.

**17. Share Dialog Rejection**
- **Detail:** If a user opens the native Share dialog and immediately dismisses it, `react-native-share` throws an error.
- **Action:** Wrap `Share.open` in a try/catch and specifically ignore the "User did not share" error so it doesn't pollute crash logs.

**18. Settings Screen Layout**
- **Detail:** Margins and paddings between sections in `SettingsScreen` might feel slightly uneven.
- **Action:** Audit spacing against `designTokens.spacing`.

**19. Standardized Empty States**
- **Detail:** The empty state in `AlbumsScreen` looks different from `FavoritesScreen`.
- **Action:** Create a shared `<EmptyState />` component to ensure illustrations, titles, and buttons are unified.

**20. Toast Z-Index/Overlap**
- **Detail:** The global `<Toast />` component might be hidden behind the `BottomActionBar` or modals.
- **Action:** Ensure Toast is rendered at the absolute highest level in `App.tsx` and has appropriate bottom padding or `zIndex`.

**21. Text Truncation**
- **Detail:** Exceptionally long album names or tags might break the UI layout.
- **Action:** Ensure `numberOfLines={1}` and `ellipsizeMode="tail"` are consistently applied to user-generated text fields in list views.

**22. Dynamic Permission Revocation**
- **Detail:** If the app is sent to the background, the user revokes photo permissions, and the app resumes, it might crash or show a blank screen.
- **Action:** Add an `AppState` listener to re-verify permissions when the app comes back to the foreground.

**23. AsyncStorage Limits**
- **Detail:** Android has a strict 6MB limit on AsyncStorage by default. If a user adds thousands of screenshots with notes and OCR data, this might crash.
- **Action:** Increase the SQLite limit in Android native code or migrate to a better local DB (like MMKV or WatermelonDB) for heavy metadata.

**24. OCR Service Resilience**
- **Detail:** If the mock OCR service fails, the app doesn't retry.
- **Action:** Implement a background retry queue for un-indexed screenshots.

**25. Android Hardware Back Button**
- **Detail:** Pressing the physical back button while a BottomSheet is open will navigate to the previous screen instead of closing the sheet.
- **Action:** Intercept the back button press using `BackHandler` when custom sheets are visible.

**26. Notch Support in Full-Screen Viewer**
- **Detail:** `react-native-image-viewing` might place close buttons dangerously close to the dynamic island/notch.
- **Action:** Wrap its header/footer components in a `SafeAreaView`.

**27. Missing Haptic Feedback**
- **Detail:** Moving items to albums or deleting them feels "dead" without tactile feedback.
- **Action:** Implement `react-native-haptic-feedback` on major destructive or organizing actions.

**28. Hardcoded Strings**
- **Detail:** All text is hardcoded in the `.tsx` files.
- **Action:** Move strings to a constants file or localization framework to allow for future translations.

**29. Navigation Type Safety**
- **Detail:** Some nested navigation routes might not have perfect type inference.
- **Action:** Audit `RootStackParamList` usages.

**30. Import Organization**
- **Detail:** Imports are messy.
- **Action:** Run a global format/sort imports pass.

**31. "Any" Types Check**
- **Detail:** Ensure no `any` types have slipped into the codebase.
- **Action:** Enable strict typescript checking.
