/**
 * Typed application configuration.
 *
 * Values are read from react-native-config (which bridges .env → native).
 * Each key falls back to a safe default so the app works even without a
 * .env file (e.g. fresh clone, CI, TestFlight build).
 *
 * Add new keys here — never read from `Config` directly anywhere else.
 */

let RNConfig: Record<string, string | undefined> = {};

try {
  // react-native-config is an optional native module.
  // If not yet linked (fresh install before pod install / gradle sync)
  // we fall through to the defaults below.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RNConfig = require('react-native-config').default ?? {};
} catch {
  // Not linked yet — all values fall back to defaults.
}

const bool = (key: string, fallback: boolean): boolean => {
  const v = RNConfig[key];
  if (v === undefined) return fallback;
  return v.toLowerCase() === 'true';
};

const str = (key: string, fallback: string): string =>
  RNConfig[key] ?? fallback;

const num = (key: string, fallback: number): number => {
  const v = RNConfig[key];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ── Exported config object ────────────────────────────────────────────────────

export const AppConfig = {
  // App identity
  appName: str('APP_NAME', 'Screenshoti'),
  appEnv: str('APP_ENV', 'development'),
  appVersion: str('APP_VERSION', '1.0.0'),
  appBuild: num('APP_BUILD', 1),

  // Feature flags
  featureCloudSync: bool('FEATURE_CLOUD_SYNC', false),
  featureOcr: bool('FEATURE_OCR', true),
  featureSmartCategories: bool('FEATURE_SMART_CATEGORIES', true),
  featurePinLock: bool('FEATURE_PIN_LOCK', true),
  featureDemoSeed: bool('FEATURE_DEMO_SEED', true),

  // Demo / showcase
  demoMode: bool('DEMO_MODE', true),
  demoScreenshotCount: num('DEMO_SCREENSHOT_COUNT', 24),

  // Sync
  syncSecret: str('SYNC_SECRET', 'screenshoti-demo-secret-change-in-prod'),

  // Analytics
  analyticsDebug: bool('ANALYTICS_DEBUG', __DEV__),

  // Sentry (empty string = disabled)
  sentryDsn: str('SENTRY_DSN', ''),

  // API
  apiBaseUrl: str('API_BASE_URL', 'https://api.screenshoti.app'),
  apiTimeoutMs: num('API_TIMEOUT_MS', 10000),

  // Derived helpers
  get isProduction(): boolean {
    return this.appEnv === 'production';
  },
  get isDevelopment(): boolean {
    return this.appEnv === 'development';
  },
} as const;

export type AppConfigType = typeof AppConfig;
