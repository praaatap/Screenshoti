# Screenshoti - Project Roadmap & Fixes

This document outlines the planned fixes, technical debt reduction, and visionary new features for the Screenshoti application.

## 🛠️ Fixes & Technical Debt (30+)

### Code Quality & Linting
1. **Fix inline styles:** Move inline styles in `BottomActionBar.tsx`, `ScreenshotCard.tsx`, `ScreenshotGrid.tsx`, `Badge.tsx`, `Button.tsx`, `Chip.tsx`, and `DetailScreen.tsx` to `StyleSheet.create`.
2. **Resolve exhaustive-deps warnings:** Fix missing dependencies in `useEffect` and `useCallback` hooks within `ShimmerSkeleton.tsx` and `usePermissions.ts`.
3. **Remove unused code:** Clean up unused `useCallback` imports in `DetailScreen.tsx` and `ScreenshotCard.tsx`, and the unused `checkMultiple` variable in `usePermissions.ts`.
4. **Fix unstable nested components:** Refactor `RootNavigator.tsx` to define `MainTabsNavigator` and other nested components outside of the render function to prevent unnecessary DOM destruction and state loss.
5. **Fix dot-notation warnings:** Refactor dictionary access to dot notation in `useFilteredScreenshots.ts` where applicable.
6. **Fix bitwise operator warning:** Investigate and resolve the unexpected use of the `^` operator in `syncService.ts`.
7. **Fix unused arguments:** Remove or properly utilize the `uri` argument in `screenshotUtils.ts`.
8. **Enforce `no-void` rule:** Address or suppress the numerous `no-void` warnings consistently across the project (e.g., in `HomeScreen.tsx`, `SettingsScreen.tsx`, etc.).
9. **Clean up ESLint disable comments:** Remove the unused `eslint-comments/no-unused-disable` for `no-console` in `analytics.ts`.
10. **Organize imports:** Implement an automated import sorter (e.g., `eslint-plugin-simple-import-sort`) for consistency across all files.
11. **Type strictness:** Ensure strictly typed navigation parameters across all nested stacks, removing any `any` types.

### Performance Optimization
12. **Optimize `ScreenshotGrid` re-renders:** Implement `React.memo` and custom comparison functions for `ScreenshotCard` to prevent the entire grid from re-rendering when a single item's selection state changes.
13. **List rendering efficiency:** Fine-tune `windowSize`, `maxToRenderPerBatch`, and `updateCellsBatchingPeriod` in `FlatList` for lower-end Android devices.
14. **Image Caching:** Implement a robust image caching solution (e.g., `react-native-fast-image`) to handle loading thousands of gallery thumbnails without memory bloat.
15. **Skeleton animation performance:** Ensure the shimmer/skeleton animations use the native driver (`useNativeDriver: true` or Reanimated equivalents) to avoid JS thread blocking.
16. **Store modularization:** If `useScreenshotStore` grows further, split it into smaller slices (e.g., `metadataSlice`, `selectionSlice`) to reduce unnecessary component updates.

### UI/UX Polish & Bug Fixes
17. **Keyboard behavior:** Fix `KeyboardAvoidingView` behavior on Android in `DetailScreen` and `SearchScreen` to ensure inputs are never obscured.
18. **Dark mode flickering:** Ensure smooth theme transitions without a flash of white text when switching to dark mode.
19. **Accessibility (a11y):** Improve accessibility labels and hints on interactive elements, particularly the Grid items and custom Floating Action Buttons.
20. **Share dialog crash:** Handle edge cases in `Share.open` where rapid dismissal might cause unhandled promise rejections.
21. **Settings layout:** Normalize spacing and layout alignment in `SettingsScreen` to strictly adhere to `designTokens`.
22. **Empty states:** Standardize empty state illustrations, typography, and action buttons across `Albums`, `Favorites`, and `Search`.
23. **Toast overlap:** Ensure `Toast` notifications do not overlap with the `BottomActionBar` or the bottom tab navigation.
24. **Long text truncation:** Ensure album names and tag chips gracefully truncate with an ellipsis (`...`) instead of wrapping awkwardly.
25. **Permissions handling:** Gracefully handle the scenario where a user revokes gallery permissions via OS settings while the app is backgrounded.
26. **AsyncStorage edge cases:** Add fallback logic for instances where `AsyncStorage` might fail to persist state due to device storage limits.
27. **OCR resilience:** Improve OCR extraction failure handling; if background indexing fails, queue it for a retry rather than failing silently.
28. **Hardware back button (Android):** Ensure the Android hardware back button behaves correctly when the `BottomSheet` or `ConfirmationSheet` is open (it should close the sheet, not navigate back).
29. **Notch support in modals:** Ensure full-screen modals or image viewers (`react-native-image-viewing`) respect safe area insets to avoid content hiding behind the notch.
30. **Feedback on interactions:** Add subtle haptic feedback (vibration) to important actions like moving to an album, favoriting, or deleting.
31. **Localization prep:** Extract hardcoded English strings into a central localization file/system (e.g., `i18next`) to prepare for multi-language support.

---

## 🚀 New Features (20)

### Intelligence & Organization
1. **On-Device ML Classification:** Implement advanced, privacy-first on-device machine learning to automatically categorize screenshots (e.g., Memes, Recipes, Maps, Social Media) beyond basic text OCR.
2. **Duplicate Detection & Merging:** Introduce a "Clean Up" tool that visually analyzes the gallery to detect exact or near-duplicates and suggests merging or deleting them.
3. **Smart Links:** Automatically extract actionable URLs, phone numbers, and email addresses from screenshots and display them as clickable chips in the Detail screen.
4. **Nested Albums:** Support creating folders within folders for advanced hierarchical organization.
5. **Auto-Tagging Rules:** Allow users to set up rules (e.g., "If OCR detects 'Invoice', apply tag 'Finance' and move to 'Expenses' album").

### Privacy & Security
6. **Biometric Vault:** Introduce a "Hidden" or "Locked" album protected by FaceID, TouchID, or a secure PIN.
7. **Redaction Tool:** Add a built-in image editor specifically designed to quickly blur, pixelate, or black out sensitive information (like passwords or account numbers) before sharing.
8. **Recently Deleted (Trash):** Implement a "Trash" bin that holds deleted screenshots for 30 days before permanently wiping them, preventing accidental data loss.

### Productivity & Tools
9. **Built-in Image Editor:** Provide basic markup tools—crop, rotate, highlight, draw, and add text annotations directly within the app.
10. **PDF Export & Reports:** Select multiple screenshots (e.g., receipts) and generate a neat, paginated PDF report.
11. **Voice Notes:** Allow users to attach a quick voice memo or audio annotation to a specific screenshot.
12. **Advanced Search Filters:** Enhance search to support complex queries (e.g., filtering by date ranges, specific dimensions, or dominant colors).

### Ecosystem & Integrations
13. **Share Extension:** Create a native iOS/Android Share Extension so users can save images directly into Screenshoti from web browsers, social apps, or messengers without saving them to the main gallery first.
14. **Home Screen Widgets:** Add iOS and Android widgets to display a random "Favorite" screenshot, or provide a quick shortcut to launch the app and immediately capture/import a screenshot.
15. **Cloud Sync & Backup:** Introduce optional end-to-end encrypted cloud sync via Google Drive, Dropbox, or iCloud to keep data safe across devices.
16. **Web Dashboard:** Build a companion web interface allowing users to browse, search, and download their synced screenshots from a desktop computer.
17. **App Shortcuts:** Add long-press app icon shortcuts on the OS home screen (e.g., "Search", "Open Vault", "Scan New").

### UX & Delight
18. **Swipe Actions:** Introduce customizable swipe gestures on list items (e.g., swipe right to favorite, swipe left to delete/move).
19. **Memories / "On This Day":** A feature that surfaces interesting screenshots from months or years ago (similar to Google Photos memories).
20. **Video / Screen Recording Support:** Expand support beyond static images to manage, trim, and organize screen recordings.
