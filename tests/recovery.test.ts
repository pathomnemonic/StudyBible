// Error-boundary recovery (audit item 3): remove only the app's own downloaded code, keep what the person downloaded, and never touch other apps on the same address.
import { describe, expect, it } from 'vitest';
import { planRecovery } from '../src/lib/recover';

const scope = 'https://pathomnemonic.github.io/StudyBible/';
const seeded = [
  `workbox-precache-v2-${scope}`,          // this app's precache (app shell)
  `workbox-precache-v2-https://pathomnemonic.github.io/OtherApp/`, // another app on the same origin
  'studybible-heavy-v1',                    // lazily cached 3D and map code (this app's runtime code)
  'studybible-data-v1',                     // offline Bible and content packs
  'studybible-audio-v1',                    // offline audio the person downloaded
  'some-other-sites-cache',                 // unrelated
];
const regs = [scope, 'https://pathomnemonic.github.io/OtherApp/'];

describe('planRecovery', () => {
  it('online: removes this app\'s precache and runtime code only', () => {
    const p = planRecovery({ online: true, scope, cacheNames: seeded, registrationScopes: regs });
    expect(p.blockedOffline).toBe(false);
    expect(p.removeCaches.sort()).toEqual([`workbox-precache-v2-${scope}`, 'studybible-heavy-v1'].sort());
  });
  it('keeps offline packs, offline audio, another app\'s precache and unrelated caches', () => {
    const p = planRecovery({ online: true, scope, cacheNames: seeded, registrationScopes: regs });
    for (const keep of ['studybible-data-v1', 'studybible-audio-v1', 'some-other-sites-cache', 'workbox-precache-v2-https://pathomnemonic.github.io/OtherApp/']) expect(p.keepCaches).toContain(keep);
    expect(p.removeCaches).not.toContain('studybible-data-v1');
    expect(p.removeCaches).not.toContain('studybible-audio-v1');
  });
  it('unregisters only this app\'s service worker', () => {
    const p = planRecovery({ online: true, scope, cacheNames: seeded, registrationScopes: regs });
    expect(p.removeScopes).toEqual([scope]);
  });
  it('offline: nothing is removed, and the person is told', () => {
    const p = planRecovery({ online: false, scope, cacheNames: seeded, registrationScopes: regs });
    expect(p.blockedOffline).toBe(true);
    expect(p.removeCaches).toEqual([]);
    expect(p.removeScopes).toEqual([]);
    expect(p.keepCaches.length).toBe(seeded.length);
  });
  it('a media cache by any studybible-media / offline name is never removed', () => {
    const p = planRecovery({ online: true, scope, cacheNames: ['studybible-media-v2', 'studybible-offline-pack', `workbox-precache-v2-${scope}`], registrationScopes: [scope] });
    expect(p.removeCaches).toEqual([`workbox-precache-v2-${scope}`]);
  });
  it('nothing seeded: nothing to do', () => {
    const p = planRecovery({ online: true, scope, cacheNames: [], registrationScopes: [] });
    expect(p.removeCaches).toEqual([]);
    expect(p.removeScopes).toEqual([]);
  });
});
