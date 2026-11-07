import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Wraps the built PWA (dist/) as a store app.  See docs/LAUNCH.md for the exact steps.
 * The app is fully offline-capable, so the wrapper ships the files inside the binary and never loads a remote site.
 */
const config: CapacitorConfig = {
  appId: 'org.cathology.app',
  appName: 'Cathology',
  webDir: 'dist',
  backgroundColor: '#0a0c1c',
  server: { androidScheme: 'https', iosScheme: 'app' },
  ios: { contentInset: 'always', backgroundColor: '#0a0c1c', limitsNavigationsToAppBoundDomains: false },
  android: { backgroundColor: '#0a0c1c', allowMixedContent: false },
};
export default config;
