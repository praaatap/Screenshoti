import {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState, type AppStateStatus, Platform} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  checkMultiple,
  openSettings,
  request,
  type Permission,
  type PermissionStatus,
} from 'react-native-permissions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoAccessLevel = 'full' | 'limited' | 'denied' | 'unavailable' | 'unknown';

export interface PermissionState {
  photoAccess: PhotoAccessLevel;
  isLoading: boolean;
  hasCheckedOnce: boolean;
}

export interface UsePermissionsResult extends PermissionState {
  ensurePhotoPermission: () => Promise<boolean>;
  recheckPermission: () => Promise<void>;
  openAppSettings: () => void;
  isLimited: boolean;
  isGranted: boolean;
  isDenied: boolean;
}

// ─── Module-level cache ───────────────────────────────────────────────────────
// Survives re-renders and re-mounts — no system calls after first check

let sessionCache: PhotoAccessLevel | null = null;
let hasPromptedThisSession = false;

// ─── Platform helpers ─────────────────────────────────────────────────────────

const getAndroidSdkVersion = (): number =>
  typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);

/**
 * Returns the correct permission for the current platform + OS version.
 *
 * Android SDK breakdown:
 *  < 29  → READ_EXTERNAL_STORAGE (legacy)
 *  29–32 → READ_EXTERNAL_STORAGE (scoped storage, still needed)
 *  33+   → READ_MEDIA_IMAGES (granular media permission, Android 13+)
 *
 * iOS:
 *  All versions → PHOTO_LIBRARY
 *  iOS 14+ also returns RESULTS.LIMITED for partial access
 */
const resolvePhotoPermission = (): Permission | null => {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }

  if (Platform.OS === 'android') {
    const sdk = getAndroidSdkVersion();
    if (sdk >= 33) return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES; // Android 13+
    return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;            // Android < 13
  }

  return null; // unsupported platform
};

// ─── Status mapping ───────────────────────────────────────────────────────────

const mapToAccessLevel = (status: PermissionStatus): PhotoAccessLevel => {
  switch (status) {
    case RESULTS.GRANTED:
      return 'full';
    case RESULTS.LIMITED:
      return 'limited';   // iOS 14+ partial photo access
    case RESULTS.DENIED:
    case RESULTS.BLOCKED:
      return 'denied';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    default:
      return 'unknown';
  }
};

const isUsable = (level: PhotoAccessLevel): boolean =>
  level === 'full' || level === 'limited';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const usePermissions = (): UsePermissionsResult => {
  const [state, setState] = useState<PermissionState>({
    photoAccess: sessionCache ?? 'unknown',
    isLoading: false,
    hasCheckedOnce: sessionCache !== null,
  });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ── Re-check when app returns from background (user may have changed settings) ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextState === 'active';

      if (wasBackground && isNowActive && sessionCache !== null) {
        // Silently recheck — user may have toggled permission in iOS Settings
        const permission = resolvePhotoPermission();
        if (!permission) return;

        try {
          const current = await check(permission);
          const newLevel = mapToAccessLevel(current);

          // Only update if status actually changed
          if (newLevel !== sessionCache) {
            sessionCache = newLevel;
            setState((prev) => ({...prev, photoAccess: newLevel}));
          }
        } catch {
          // Silently ignore background recheck errors
        }
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  // ── Core permission check ──────────────────────────────────────────────────

  const checkPermissionSilently = useCallback(async (): Promise<PhotoAccessLevel> => {
    const permission = resolvePhotoPermission();

    // Platform doesn't require permission (e.g. some Android builds)
    if (!permission) return 'full';

    try {
      const status = await check(permission);
      return mapToAccessLevel(status);
    } catch {
      return 'unknown';
    }
  }, []);

  // ── Public: recheck without prompting (called on app focus, tab focus, etc.) ──

  const recheckPermission = useCallback(async (): Promise<void> => {
    const level = await checkPermissionSilently();
    sessionCache = level;
    setState((prev) => ({...prev, photoAccess: level, hasCheckedOnce: true}));
  }, [checkPermissionSilently]);

  // ── Public: ensure + prompt if needed ─────────────────────────────────────

  const ensurePhotoPermission = useCallback(async (): Promise<boolean> => {
    // 1. Return cached usable result immediately — zero system calls
    if (sessionCache !== null && isUsable(sessionCache)) {
      setState((prev) => ({...prev, photoAccess: sessionCache!, hasCheckedOnce: true}));
      return true;
    }

    setState((prev) => ({...prev, isLoading: true}));

    const permission = resolvePhotoPermission();

    // Platform has no permission requirement
    if (!permission) {
      sessionCache = 'full';
      setState({photoAccess: 'full', isLoading: false, hasCheckedOnce: true});
      return true;
    }

    try {
      // 2. Check current status without prompting
      const currentStatus = await check(permission);
      const currentLevel = mapToAccessLevel(currentStatus);

      if (isUsable(currentLevel)) {
        sessionCache = currentLevel;
        setState({photoAccess: currentLevel, isLoading: false, hasCheckedOnce: true});
        return true;
      }

      // 3. If already denied/blocked — don't prompt again, show settings CTA instead
      if (currentStatus === RESULTS.BLOCKED) {
        sessionCache = 'denied';
        setState({photoAccess: 'denied', isLoading: false, hasCheckedOnce: true});
        Alert.alert(
          'Gallery access blocked',
          Platform.OS === 'ios'
            ? 'Go to Settings → Screenshots → Photos and set access to "Full Access" or "Selected Photos".'
            : 'Go to Settings → App Permissions → Photos and enable access.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => { void openSettings(); }},
          ],
        );
        return false;
      }

      // 4. Only show the system permission dialog ONCE per session
      if (hasPromptedThisSession) {
        setState((prev) => ({...prev, isLoading: false, hasCheckedOnce: true}));
        return false;
      }

      hasPromptedThisSession = true;
      const requestedStatus = await request(permission);
      const grantedLevel = mapToAccessLevel(requestedStatus);

      sessionCache = grantedLevel;
      setState({photoAccess: grantedLevel, isLoading: false, hasCheckedOnce: true});

      // 5. iOS 14+ LIMITED access — inform user they can expand access
      if (requestedStatus === RESULTS.LIMITED) {
        Alert.alert(
          'Limited photo access',
          'You\'ve given access to only some photos. To see all screenshots, tap "Change" and select "Full Access".',
          [
            {text: 'Keep limited', style: 'cancel'},
            {text: 'Change', onPress: () => { void openSettings(); }},
          ],
        );
        return true; // LIMITED is still usable
      }

      // 6. Fully denied
      if (!isUsable(grantedLevel)) {
        Alert.alert(
          'Gallery access needed',
          'Your screenshots can\'t load without photo library access.',
          [
            {text: 'Not now', style: 'cancel'},
            {text: 'Open Settings', onPress: () => { void openSettings(); }},
          ],
        );
        return false;
      }

      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Permission check failed.';
      sessionCache = 'unknown';
      setState({photoAccess: 'unknown', isLoading: false, hasCheckedOnce: true});
      Alert.alert('Permission error', message);
      return false;
    }
  }, [checkPermissionSilently]);

  // ── Public: open settings shortcut ────────────────────────────────────────

  const openAppSettings = useCallback((): void => {
    void openSettings();
  }, []);

  // ── Derived booleans ───────────────────────────────────────────────────────

  return {
    ...state,
    ensurePhotoPermission,
    recheckPermission,
    openAppSettings,
    isLimited: state.photoAccess === 'limited',
    isGranted: state.photoAccess === 'full',
    isDenied: state.photoAccess === 'denied',
  };
};