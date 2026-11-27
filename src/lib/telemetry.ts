/**
 * Error reports (Sentry) and page counts (PostHog), on the public web app only. Deliberately small:
 *  - production builds on a real host only (never in development, tests, the native store apps or Kid mode);
 *  - off if the browser sends Do Not Track or Global Privacy Control, or the person turns it off in Settings;
 *  - in the EU, the UK and the EEA (judged by the device time zone) nothing runs until the person agrees; a banner asks, and Settings holds the same choice; a stored refusal stops reports in every region;
 *  - loaded lazily after the app is up, so it adds nothing to the first load;
 *  - no cookies or browser storage, no session recording, no click capture, no breadcrumbs, no tracing, no person profiles;
 *  - only the first part of the address is ever sent (for example "#/read", never the book, chapter, search words or notes).
 * Both services are given the tag app=cathology. The keys are public client keys, not secrets.
 */
import { getSettings } from './store';

export const SENTRY_DSN = 'https://589d3a9a705c5728c19c1b8a8ae2d020@o4512486931169280.ingest.us.sentry.io/4512486944604160';
export const POSTHOG_KEY = 'phc_kWmx5oVY3FreyoD2myh2jTYZKyuDXYsLHBGkvCq3yyYY';
/** the PostHog region of the shared project; change with VITE_POSTHOG_HOST (https://eu.i.posthog.com for the EU region) */
export const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';
export const APP_TAG = 'cathology';

type Win = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

/** The address with everything after the first path part removed: "https://host/path/#/read/dra/JHN/3?x=1" becomes "https://host/path/#/read". */
export function coarseUrl(href: string): string {
  try {
    const u = new URL(href);
    const first = u.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
    return `${u.origin}${u.pathname}#/${first}`;
  } catch { return ''; }
}
export const coarseRoute = (hashPath: string) => `/${hashPath.replace(/^\//, '').split(/[/?]/)[0]}`;

/** Atlantic time zones that belong to the region below although they do not start with "Europe/": Iceland (EEA), the Canaries and Madeira (EU), the Azores (EU) and the Faroes. */
const CONSENT_ATLANTIC = ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faeroe', 'Atlantic/Faroe'];

/** Time zones in the region that start with neither "Europe/" nor "Atlantic/": Cyprus (EU), Ceuta and Melilla (EU), the French outermost regions in the Americas and the Indian Ocean (EU), and Svalbard (EEA). */
const CONSENT_EXTRA = ['Asia/Nicosia', 'Asia/Famagusta', 'Africa/Ceuta', 'America/Guadeloupe', 'America/Marigot', 'America/St_Barthelemy', 'America/Martinique', 'America/Cayenne', 'Indian/Reunion', 'Indian/Mayotte', 'Arctic/Longyearbyen'];

/** Whether a time zone is in the EU, the UK or the EEA, where an answer is required before any reports are sent. Judged by time zone only: nothing is looked up and no address leaves the device. */
export function consentRegionFor(tz: string | undefined | null): boolean {
  if (!tz) return false;
  return tz.startsWith('Europe/') || CONSENT_ATLANTIC.includes(tz) || CONSENT_EXTRA.includes(tz);
}

/** Whether this device sits in the region where reports need the person's agreement first. */
export function inConsentRegion(): boolean {
  try { return consentRegionFor(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { return false; }
}

/** Whether reports may be sent from this page right now. */
export function telemetryAllowed(w: Win | undefined = typeof window === 'undefined' ? undefined : (window as Win)): boolean {
  if (!w || !import.meta.env.PROD) return false;
  try {
    if (/^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(w.location.hostname) || w.location.protocol === 'file:') return false;
    if (w.Capacitor?.isNativePlatform?.()) return false; // store apps stay as their listings say until the store forms are updated
    const nav = w.navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
    if (nav.doNotTrack === '1' || (w as unknown as { doNotTrack?: string }).doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl === true) return false;
    const s = getSettings();
    if (s.kidMode || s.telemetry === false) return false;
    if (s.telemetryConsent === 'denied') return false; // a stored refusal stops reports in every region, not only where agreement is required first
    if (inConsentRegion() && s.telemetryConsent !== 'granted') return false; // the EU, the UK and the EEA: agreement first
  } catch { return false; }
  return true;
}

/** Whether the banner asking for that agreement should be offered: the public website on a real host (never a store app, a local copy or Kid mode), in the consent region, with no answer yet and reports not already switched off in Settings. */
export function consentPromptNeeded(w: Win | undefined = typeof window === 'undefined' ? undefined : (window as Win)): boolean {
  if (!w || !import.meta.env.PROD) return false;
  try {
    if (/^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(w.location.hostname) || w.location.protocol === 'file:') return false;
    if (w.Capacitor?.isNativePlatform?.()) return false;
    const s = getSettings();
    if (s.kidMode || s.telemetry === false) return false;
    if (s.telemetryConsent === 'granted' || s.telemetryConsent === 'denied') return false;
    return inConsentRegion();
  } catch { return false; }
}

let started: Promise<void> | null = null;
let posthogRef: { capture: (e: string, p?: Record<string, unknown>) => void; opt_out_capturing: () => void; opt_in_capturing: () => void } | null = null;
let sentryRef: { close: () => Promise<boolean>; captureException: (e: unknown) => string } | null = null;

async function start() {
  const [{ default: posthog }, Sentry] = await Promise.all([import('posthog-js'), import('@sentry/browser')]);
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    release: (import.meta.env.VITE_RELEASE as string | undefined) || undefined,
    tracesSampleRate: 0,
    // keep only the error handlers: no breadcrumbs (they record clicks, console lines and addresses), no page context, no replay, no tracing
    integrations: (defaults) => defaults.filter((i) => ['GlobalHandlers', 'LinkedErrors', 'Dedupe', 'InboundFilters', 'FunctionToString'].includes(i.name)),
    beforeSend(event) {
      event.request = { url: coarseUrl(window.location.href) };
      event.breadcrumbs = [];
      delete event.user;
      return event;
    },
  });
  Sentry.setTag('app', APP_TAG);
  sentryRef = Sentry;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: true,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    advanced_disable_feature_flags: true,
    person_profiles: 'never',
    persistence: 'memory',
    respect_dnt: true,
    // drop every property that carries an address or a referrer (PostHog adds several, including the session's entry address), then set the one coarse address
    sanitize_properties: (props: Record<string, unknown>) => {
      for (const k of Object.keys(props)) if (/url|referr|pathname|path$/i.test(k)) delete props[k];
      props.$current_url = coarseUrl(window.location.href);
      return props;
    },
  } as never);
  posthog.register({ app: APP_TAG });
  posthogRef = posthog as never;
}

/** Start reporting if allowed. Safe to call more than once; does nothing when not allowed. */
export function initTelemetry() {
  if (started || !telemetryAllowed()) return;
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  // the promise exists at once, so a page view counted before the libraries have loaded waits for them instead of being lost
  started = new Promise<void>((done) => {
    const run = () => { start().catch(() => { started = null; }).then(() => done()); };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 }); else setTimeout(run, 2000);
  });
}

let lastAllowed: boolean | null = null;
let lastPath: string | null = null;
/** Called on every route change and when the Settings choice changes: starts, pauses or resumes reporting as needed, and counts a page when the route changed. */
export function onRoute(hashPath: string) {
  const allowed = telemetryAllowed();
  if (allowed !== lastAllowed) {
    if (allowed) { if (lastAllowed === false) posthogRef?.opt_in_capturing(); initTelemetry(); }
    else if (lastAllowed === true) { posthogRef?.opt_out_capturing(); void sentryRef?.close(); sentryRef = null; started = null; }
    lastAllowed = allowed;
  }
  if (allowed && hashPath !== lastPath) trackPageview(hashPath);
  lastPath = hashPath;
}

/** One page view, with only the first part of the route. */
export function trackPageview(hashPath: string) {
  if (!telemetryAllowed()) return;
  initTelemetry();
  const send = () => posthogRef?.capture('$pageview', { route: coarseRoute(hashPath), app: APP_TAG });
  if (posthogRef) send(); else void started?.then(send);
}

/** The error screen calls this (window.__report) for an error the app caught itself (for example in an error screen); sent only if reporting is on. */
function reportCaughtError(err: unknown) {
  if (!telemetryAllowed()) return;
  initTelemetry();
  const send = () => { try { sentryRef?.captureException(err); } catch { /* never let reporting fail the app */ } };
  if (sentryRef) send(); else void started?.then(send);
}

if (typeof window !== 'undefined') (window as unknown as { __report?: (e: unknown) => void }).__report = reportCaughtError;
