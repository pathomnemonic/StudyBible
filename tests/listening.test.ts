// The Year page's listening numbers must come from what really played, never from episodes marked as played.
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('location', { origin: 'https://example.org' });

describe('listening time', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });
  it('marking 1,000 episodes played adds no hours and no played-to-the-end episodes (the bug: 407.9 hours and 1,097 finished)', async () => {
    const { db } = await import('../src/db/db'); const { setPlayed, listeningStats } = await import('../src/lib/listening');
    for (let i = 0; i < 1000; i++) await setPlayed(`ep${i}`, true, 1800);
    const rows = await db.episodeProgress.toArray();
    expect(rows.every((r) => r.completed)).toBe(true);
    expect(listeningStats(rows, new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
  });
  it('real playback is credited, accumulates across saves, and survives a later "mark played"', async () => {
    const { db } = await import('../src/db/db'); const { setPlayed, creditListening, listeningStats } = await import('../src/lib/listening');
    await creditListening('a', 600, { position: 600, duration: 1800 });
    await creditListening('a', 900, { position: 1500, duration: 1800 });
    await creditListening('a', 300, { position: 0, duration: 1800, completed: true, ranToEnd: true });
    await setPlayed('a', false); await setPlayed('a', true, 1800);
    const r = await db.episodeProgress.get('a');
    expect(r?.heard).toBe(1800); expect(r?.ranToEnd).toBe(true);
    expect(listeningStats(await db.episodeProgress.toArray(), new Date().getFullYear())).toEqual({ hours: 0.5, playedToEnd: 1 });
  });
  it('legacy cumulative totals and boolean completion have no recoverable year and are excluded', async () => {
    const { listeningStats, hasUndatedListening } = await import('../src/lib/listening');
    const rows = [{ heard: 1800, ranToEnd: true }, { position: 1800, completed: false }, { completed: true }] as never[];
    expect(listeningStats(rows, new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
    expect(hasUndatedListening(rows)).toBe(true);
  });
  it('attributes listening increments and a real completion to the calendar year in which they occur', async () => {
    const { db } = await import('../src/db/db'); const { creditListening, listeningStats } = await import('../src/lib/listening');
    vi.useFakeTimers(); vi.setSystemTime(new Date('2025-12-31T23:59:00'));
    await creditListening('split', 60);
    vi.setSystemTime(new Date('2026-01-01T00:01:00'));
    await creditListening('split', 120, { ranToEnd: true, completed: true });
    const rows = await db.episodeProgress.toArray();
    expect(listeningStats(rows, 2025)).toEqual({ hours: 0.2, playedToEnd: 0 });
    expect(listeningStats(rows, 2026)).toEqual({ hours: 0.3, playedToEnd: 1 });
    vi.useRealTimers();
  });
  it('position-only progress saves do not add dated listening or completion', async () => {
    const { db } = await import('../src/db/db'); const { creditListening, listeningStats } = await import('../src/lib/listening');
    await creditListening('position', 0, { position: 300 });
    expect(listeningStats(await db.episodeProgress.toArray(), new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
  });
});
