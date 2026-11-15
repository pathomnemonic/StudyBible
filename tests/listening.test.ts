// The Year page's listening numbers must come from what really played, never from episodes marked as played.
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('location', { origin: 'https://example.org' });

describe('listening time', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });
  afterEach(() => vi.useRealTimers());
  it('marking 1,000 episodes played adds no hours and no played-to-the-end episodes (the bug: 407.9 hours and 1,097 finished)', async () => {
    const { db } = await import('../src/db/db'); const { setPlayed, listeningStats } = await import('../src/lib/listening');
    for (let i = 0; i < 1000; i++) await setPlayed(`ep${i}`, true, 1800);
    const rows = await db.episodeProgress.toArray();
    expect(rows.every((r) => r.completed)).toBe(true);
    expect(listeningStats(rows, new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
  });
  it('real playback is credited, accumulates across saves, and survives a later "mark played"', async () => {
    const { db } = await import('../src/db/db'); const { setPlayed, creditListening, listeningStats, listeningDay } = await import('../src/lib/listening');
    const at = new Date(2026, 5, 1, 12);
    await creditListening('a', 600, { position: 600, duration: 1800 }, at);
    await creditListening('a', 900, { position: 1500, duration: 1800 }, at);
    await creditListening('a', 300, { position: 0, duration: 1800, completed: true, ranToEnd: true }, at);
    await setPlayed('a', false); await setPlayed('a', true, 1800);
    const r = await db.episodeProgress.get('a');
    expect(r?.heard).toBe(1800); expect(r?.ranToEnd).toBe(true);
    expect(r?.listeningDays?.[listeningDay(at)]).toEqual({ seconds: 1800, completions: 1 });
    expect(listeningStats(await db.episodeProgress.toArray(), at.getFullYear())).toEqual({ hours: 0.5, playedToEnd: 1 });
  });
  it('legacy cumulative totals and boolean completion have no recoverable year and are excluded', async () => {
    const { listeningStats, hasUndatedListening } = await import('../src/lib/listening');
    const rows = [{ heard: 1800, ranToEnd: true }, { position: 1800, completed: false }, { completed: true }] as never[];
    expect(listeningStats(rows, new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
    expect(hasUndatedListening(rows)).toBe(true);
  });
  it('does not warn about legacy progress rows with zero listening and no completion', async () => {
    const { hasUndatedListening } = await import('../src/lib/listening');
    expect(hasUndatedListening([{ heard: 0 }, { position: 30, completed: false } as never])).toBe(false);
    expect(hasUndatedListening([{ heard: 0, ranToEnd: true }])).toBe(true);
  });

  it('attributes listening increments and a real completion to the calendar year in which they occur', async () => {
    const { db } = await import('../src/db/db'); const { creditListening, listeningStats } = await import('../src/lib/listening');
    await creditListening('split', 600, {}, new Date(2025, 11, 31, 23, 59));
    await creditListening('split', 1200, { ranToEnd: true, completed: true }, new Date(2026, 0, 1, 0, 1));
    const rows = await db.episodeProgress.toArray();
    expect(listeningStats(rows, 2025)).toEqual({ hours: 0.2, playedToEnd: 0 });
    expect(listeningStats(rows, 2026)).toEqual({ hours: 0.3, playedToEnd: 1 });
  });

  it('does not attribute a later progress update or manual completion to a year with no listening', async () => {
    const { db } = await import('../src/db/db');
    const { creditListening, setPlayed, listeningStats } = await import('../src/lib/listening');
    await creditListening('old', 600, { position: 600 }, new Date(2025, 5, 1, 12));
    await creditListening('old', 0, { position: 240 }, new Date(2026, 5, 1, 12));
    await setPlayed('old', true, 1800);
    const rows = await db.episodeProgress.toArray();
    expect(listeningStats(rows, 2025)).toEqual({ hours: 0.2, playedToEnd: 0 });
    expect(listeningStats(rows, 2026)).toEqual({ hours: 0, playedToEnd: 0 });
  });

  it('keeps an end event in its original year when the same episode is replayed the next year', async () => {
    const { db } = await import('../src/db/db');
    const { creditListening, listeningStats } = await import('../src/lib/listening');
    await creditListening('replay', 3000, { ranToEnd: true, completed: true }, new Date(2025, 11, 31, 23, 59));
    await creditListening('replay', 1200, { completed: false }, new Date(2026, 0, 1, 0, 1));
    const rows = await db.episodeProgress.toArray();
    expect(listeningStats(rows, 2025)).toEqual({ hours: 0.8, playedToEnd: 1 });
    expect(listeningStats(rows, 2026)).toEqual({ hours: 0.3, playedToEnd: 0 });
  });

  it('accumulates frequent five-second saves without losing or multiplying listening time', async () => {
    const { db } = await import('../src/db/db');
    const { creditListening, listeningStats } = await import('../src/lib/listening');
    await Promise.all(Array.from({ length: 20 }, (_, i) => creditListening('many-saves', 5, { position: (i + 1) * 5 })));
    const rows = await db.episodeProgress.toArray();
    expect(rows[0].heard).toBe(100);
    expect(rows[0].listeningDays?.[Object.keys(rows[0].listeningDays ?? {})[0]]?.seconds).toBe(100);
    expect(listeningStats(rows, new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
  });


  it('continues disclosing legacy undated time after new dated listening is recorded', async () => {
    const { db } = await import('../src/db/db');
    const { creditListening, hasUndatedListening, listeningStats } = await import('../src/lib/listening');
    await db.episodeProgress.put({ episodeId: 'legacy-then-new', position: 0, completed: true, heard: 3600, ranToEnd: true, updatedAt: 1 });
    await creditListening('legacy-then-new', 600, { position: 600 }, new Date());
    const rows = await db.episodeProgress.toArray();
    expect(listeningStats(rows, new Date().getFullYear())).toEqual({ hours: 0.2, playedToEnd: 0 });
    expect(hasUndatedListening(rows)).toBe(true);
    expect(rows[0].undatedHeard).toBe(3600);
    expect(rows[0].undatedCompletions).toBe(1);
  });

  it('position-only progress saves do not add dated listening or completion', async () => {
    const { db } = await import('../src/db/db'); const { creditListening, listeningStats } = await import('../src/lib/listening');
    await creditListening('position', 0, { position: 300 });
    expect(listeningStats(await db.episodeProgress.toArray(), new Date().getFullYear())).toEqual({ hours: 0, playedToEnd: 0 });
  });
});
