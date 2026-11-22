/**
 * The optional tip link. It is the only money-related thing in the app: everything else is free, with no paywall, locked feature or paid tier.
 * It is an ordinary link out to the web: nothing is sent from the app, and nothing is tracked.
 */
export const TIP_URL = 'https://ko-fi.com/pathomnemonic';

/**
 * Shown on the web app. Hidden inside a native store app (Apple's and Google's rules about payments and tips inside apps must be checked before a link
 * to an outside payment page ships in one; until then the store builds do not show it).
 */
export function tipVisible(win: { Capacitor?: { isNativePlatform?: () => boolean } } | undefined = typeof window === 'undefined' ? undefined : (window as never)): boolean {
  try { return !win?.Capacitor?.isNativePlatform?.(); } catch { return true; }
}
