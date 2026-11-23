import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('window', { dispatchEvent: () => true });

describe('where you stopped in a video', () => {
  beforeEach(() => { store.clear(); vi.useRealTimers(); });

  it('keeps the 100 most recent videos, so the 61st no longer pushes out the oldest', async () => {
    const { savePos, posOf, MAX_KEPT } = await import('../src/lib/videoResume');
    expect(MAX_KEPT).toBe(100);
    for (let i = 0; i < 100; i++) savePos(`v${i}`, 120, 3600, `Video ${i}`);
    expect(posOf('v0')?.t).toBe(120); // the oldest of 100 is still there
    savePos('v100', 120, 3600, 'One more');
    expect(posOf('v0')).toBeUndefined(); // only now does the oldest go
    expect(posOf('v100')?.t).toBe(120);
  });
  it('forgets places older than 90 days, on saving and when listing, and keeps newer ones', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { savePos, posOf, inProgress } = await import('../src/lib/videoResume');
    savePos('old', 300, 3600, 'Old');
    vi.setSystemTime(new Date('2026-03-15T00:00:00Z')); // 73 days later
    expect(inProgress().map((x) => x.id)).toEqual(['old']);
    vi.setSystemTime(new Date('2026-04-15T00:00:00Z')); // 104 days after the save
    expect(inProgress()).toEqual([]); // listed no more…
    savePos('new', 300, 3600, 'New');
    expect(posOf('old')).toBeUndefined(); // …and removed the next time anything is saved
    expect(posOf('new')?.t).toBe(300);
  });
  it('does not store a video barely started or nearly finished', async () => {
    const { savePos, posOf } = await import('../src/lib/videoResume');
    savePos('a', 5, 3600, 'Just begun'); savePos('b', 3590, 3600, 'Nearly done');
    expect(posOf('a')).toBeUndefined(); expect(posOf('b')).toBeUndefined();
  });
});
