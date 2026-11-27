import { afterEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubEnv('PROD', true);

const win = (over: Record<string, unknown> = {}, loc = { hostname: 'pathomnemonic.github.io', protocol: 'https:' }) => ({ location: loc, navigator: { doNotTrack: null }, ...over }) as never;

describe('error reports and page counts', () => {
  it('sends only the first part of the address', async () => {
    const { coarseUrl, coarseRoute } = await import('../src/lib/telemetry');
    expect(coarseUrl('https://pathomnemonic.github.io/StudyBible/#/read/dra/JHN/3?x=1')).toBe('https://pathomnemonic.github.io/StudyBible/#/read');
    expect(coarseUrl('https://pathomnemonic.github.io/StudyBible/#/search?q=my%20private%20note')).toBe('https://pathomnemonic.github.io/StudyBible/#/search');
    expect(coarseRoute('/library/notes/12')).toBe('/library');
    expect(coarseRoute('/')).toBe('/');
  });
  it('is allowed on the public website only, and not with Do Not Track, Kid mode, the Settings switch, a store app or a local host', async () => {
    const { telemetryAllowed } = await import('../src/lib/telemetry');
    const { updateSettings } = await import('../src/lib/store');
    updateSettings({ kidMode: false, telemetry: true });
    expect(telemetryAllowed(win())).toBe(true);
    expect(telemetryAllowed(win({}, { hostname: 'localhost', protocol: 'http:' }))).toBe(false);
    expect(telemetryAllowed(win({ navigator: { doNotTrack: '1' } }))).toBe(false);
    expect(telemetryAllowed(win({ navigator: { globalPrivacyControl: true } }))).toBe(false);
    expect(telemetryAllowed(win({ Capacitor: { isNativePlatform: () => true } }))).toBe(false);
    updateSettings({ telemetry: false });
    expect(telemetryAllowed(win())).toBe(false);
    updateSettings({ telemetry: true, kidMode: true });
    expect(telemetryAllowed(win())).toBe(false);
    updateSettings({ kidMode: false });
  });
  it('tags every report with the app name and keeps the keys the owner gave', async () => {
    const m = await import('../src/lib/telemetry');
    expect(m.APP_TAG).toBe('cathology');
    expect(m.SENTRY_DSN).toMatch(/^https:\/\/589d3a9a705c5728c19c1b8a8ae2d020@o4512486931169280\.ingest\.us\.sentry\.io\/4512486944604160$/);
    expect(m.POSTHOG_KEY).toBe('phc_kWmx5oVY3FreyoD2myh2jTYZKyuDXYsLHBGkvCq3yyYY');
  });
});

describe('agreement first in the EU, the UK and the EEA', () => {
  const realIntl = Intl;
  const withTimeZone = (tz: string) => {
    const fake = Object.create(realIntl) as typeof Intl;
    fake.DateTimeFormat = (() => ({ resolvedOptions: () => ({ timeZone: tz }) })) as unknown as typeof Intl.DateTimeFormat;
    vi.stubGlobal('Intl', fake);
  };
  afterEach(() => { vi.stubGlobal('Intl', realIntl); });

  it('recognises the region by time zone', async () => {
    const { consentRegionFor } = await import('../src/lib/telemetry');
    for (const tz of ['Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faeroe', 'Asia/Nicosia', 'Asia/Famagusta', 'Africa/Ceuta', 'America/Guadeloupe', 'America/Marigot', 'America/St_Barthelemy', 'America/Martinique', 'America/Cayenne', 'Indian/Reunion', 'Indian/Mayotte', 'Arctic/Longyearbyen']) expect(consentRegionFor(tz), tz).toBe(true);
    for (const tz of ['America/New_York', 'America/Phoenix', 'America/Toronto', 'Asia/Tokyo', 'Australia/Sydney', 'UTC', '', undefined, null]) expect(consentRegionFor(tz), String(tz)).toBe(false);
  });
  it('sends nothing from the region until the person agrees, and nothing after a no', async () => {
    const { telemetryAllowed, consentPromptNeeded } = await import('../src/lib/telemetry');
    const { updateSettings } = await import('../src/lib/store');
    withTimeZone('Europe/Paris');
    updateSettings({ kidMode: false, telemetry: true, telemetryConsent: undefined });
    expect(telemetryAllowed(win())).toBe(false);
    expect(consentPromptNeeded(win())).toBe(true);
    expect(consentPromptNeeded(win({ Capacitor: { isNativePlatform: () => true } }))).toBe(false); // never in a store app
    expect(consentPromptNeeded(win({}, { hostname: 'localhost', protocol: 'http:' }))).toBe(false); // never on a local copy
    updateSettings({ telemetryConsent: 'denied' });
    expect(telemetryAllowed(win())).toBe(false);
    expect(consentPromptNeeded(win())).toBe(false);
    updateSettings({ telemetryConsent: 'granted' });
    expect(telemetryAllowed(win())).toBe(true);
    expect(consentPromptNeeded(win())).toBe(false);
    updateSettings({ telemetryConsent: undefined });
  });
  it('outside the region nothing changes: no answer is needed and none is asked for', async () => {
    const { telemetryAllowed, consentPromptNeeded } = await import('../src/lib/telemetry');
    const { updateSettings } = await import('../src/lib/store');
    withTimeZone('America/New_York');
    updateSettings({ kidMode: false, telemetry: true, telemetryConsent: undefined });
    expect(telemetryAllowed(win())).toBe(true);
    expect(consentPromptNeeded(win())).toBe(false);
    updateSettings({ telemetryConsent: 'denied' }); // an answer stored from the region does not gate anywhere else
    expect(telemetryAllowed(win())).toBe(true);
    updateSettings({ telemetryConsent: undefined });
  });
});
