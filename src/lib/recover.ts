/**
 * "Refresh the app" after a page fails to load (usually a stale copy of the app after an update).
 *
 * It removes only what is the app's own downloaded code, and only when it can be fetched again:
 *   removed: the app's service worker (this scope only) and its precache, and the lazily cached scene/map code;
 *   kept:    offline Bible and content packs (studybible-data-*), offline audio (studybible-audio-*), notes and settings (not in
 *            Cache Storage at all), and every cache or worker that belongs to anything else on the same web address.
 * Offline, nothing is removed: the cached copy may be the only one that works, so the person is told to reconnect.
 */
export interface RecoveryEnv {
  online: boolean;
  /** the scope of this app's service worker, e.g. https://host/StudyBible/ */
  scope: string;
  cacheNames: string[];
  registrationScopes: string[];
}

/** caches that hold things the person chose to download: never removed */
const KEEP = /^studybible-(data|audio|media|offline)/;

export interface RecoveryPlan { removeCaches: string[]; removeScopes: string[]; keepCaches: string[]; blockedOffline: boolean }

export function planRecovery(env: RecoveryEnv): RecoveryPlan {
  if (!env.online) return { removeCaches: [], removeScopes: [], keepCaches: [...env.cacheNames], blockedOffline: true };
  const mine = (name: string) =>
    // the build tool's precache is named after the scope it was installed for
    (/^workbox-precache/.test(name) && name.includes(env.scope)) ||
    // the lazily cached 3D and map code
    /^studybible-heavy-/.test(name);
  const removeCaches = env.cacheNames.filter((n) => !KEEP.test(n) && mine(n));
  return { removeCaches, removeScopes: env.registrationScopes.filter((s) => s === env.scope), keepCaches: env.cacheNames.filter((n) => !removeCaches.includes(n)), blockedOffline: false };
}

export const appScope = () => { try { return new URL(import.meta.env.BASE_URL || '/', location.origin).href; } catch { return location.origin + '/'; } };

/** Does it, then reloads. Returns false (and does nothing) when offline. */
export async function refreshApp(): Promise<boolean> {
  const regs = (await navigator.serviceWorker?.getRegistrations?.().catch(() => [])) ?? [];
  const names = (await (typeof caches !== 'undefined' ? caches.keys() : Promise.resolve([] as string[])).catch(() => [] as string[]));
  const plan = planRecovery({ online: navigator.onLine !== false, scope: appScope(), cacheNames: names, registrationScopes: regs.map((r) => r.scope) });
  if (plan.blockedOffline) return false;
  try {
    await Promise.all(regs.filter((r) => plan.removeScopes.includes(r.scope)).map((r) => r.unregister()));
    await Promise.all(plan.removeCaches.map((k) => caches.delete(k)));
  } catch { /* best effort: the reload below still fetches a fresh page */ }
  location.reload();
  return true;
}
