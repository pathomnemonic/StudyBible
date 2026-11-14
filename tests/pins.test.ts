import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; } });

const col = (n: number) => ({ kind: 'collection' as const, id: `c${n}`, title: `Collection ${n}`, to: `/collection/${n}` });

describe('pins and recent items', () => {
  beforeEach(() => { store.clear(); vi.resetModules(); });

  it('pins and unpins, newest pin first', async () => {
    const p = await import('../src/lib/pins');
    expect(p.togglePin(col(1))).toBe(true);
    expect(p.togglePin(col(2))).toBe(true);
    expect(p.getPins().map((e) => e.id)).toEqual(['c2', 'c1']);
    expect(p.isPinned('collection', 'c1')).toBe(true);
    expect(p.isPinned('plan', 'c1')).toBe(false); // the kind is part of the identity
    expect(p.togglePin(col(1))).toBe(false);
    expect(p.getPins().map((e) => e.id)).toEqual(['c2']);
  });

  it('remembers what was opened: once each, newest first, only the last few', async () => {
    const p = await import('../src/lib/pins');
    for (let i = 1; i <= 12; i++) p.recordOpened(col(i));
    p.recordOpened(col(5));
    const ids = p.getRecent().map((e) => e.id);
    expect(ids).toHaveLength(p.RECENT_KEEP);
    expect(ids[0]).toBe('c5');
    expect(new Set(ids).size).toBe(ids.length);
    p.forgetRecent();
    expect(p.getRecent()).toEqual([]);
  });

  it('a renamed thing keeps its pin and shows the new name', async () => {
    const p = await import('../src/lib/pins');
    p.togglePin(col(1));
    p.recordOpened({ ...col(1), title: 'Renamed' });
    expect(p.getPins()[0].title).toBe('Renamed');
  });

  it('survives damaged storage', async () => {
    store.set('sb:pins', '{not json');
    store.set('sb:recentItems', JSON.stringify([{ nope: 1 }, col(3)]));
    const p = await import('../src/lib/pins');
    expect(p.getPins()).toEqual([]);
    expect(p.getRecent().map((e) => e.id)).toEqual(['c3']);
  });
});
