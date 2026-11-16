// A live query whose read fails once must not take the page down; it must also still notice later changes.
import 'fake-indexeddb/auto';
import Dexie, { liveQuery } from 'dexie';
import { describe, expect, it } from 'vitest';
import { readTwice } from '../src/lib/live';

const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));

describe('readTwice (the retry behind every useLiveQuery in the app)', () => {
  it('a read that fails once succeeds on the retry, and the live query still follows later changes', async () => {
    const db = new Dexie('live-retry-1'); db.version(1).stores({ notes: '++id' });
    await db.table('notes').add({ body: 'a' });
    let calls = 0;
    const seen: number[] = []; const errors: unknown[] = [];
    const sub = liveQuery(readTwice(async () => {
      calls++;
      // the first read is made in a transaction that is aborted under it, as a browser may do
      if (calls === 1) return db.transaction('r', db.table('notes'), async (tx) => { tx.abort(); return db.table('notes').count(); });
      return db.table('notes').count();
    })).subscribe({ next: (n) => seen.push(n), error: (e) => errors.push(e) });
    await wait();
    expect(errors).toEqual([]);
    expect(seen).toEqual([1]);
    await db.table('notes').add({ body: 'b' });
    await wait();
    expect(seen, 'the retried read must still be observed').toEqual([1, 2]);
    sub.unsubscribe(); db.close();
  });

  it('a read that fails twice is a real fault and is reported', async () => {
    const db = new Dexie('live-retry-2'); db.version(1).stores({ notes: '++id' });
    const errors: unknown[] = [];
    const sub = liveQuery(readTwice(async () => { throw new Error('storage is gone'); })).subscribe({ next: () => undefined, error: (e) => errors.push(e) });
    await wait();
    expect(String(errors[0])).toContain('storage is gone');
    sub.unsubscribe(); db.close();
  });

  it('without the retry the same single failure ends the live query (what the reader saw as "This page did not load")', async () => {
    const db = new Dexie('live-retry-3'); db.version(1).stores({ notes: '++id' });
    let calls = 0; const errors: unknown[] = [];
    const sub = liveQuery(async () => { calls++; if (calls === 1) return db.transaction('r', db.table('notes'), async (tx) => { tx.abort(); return db.table('notes').count(); }); return db.table('notes').count(); }).subscribe({ next: () => undefined, error: (e) => errors.push(e) });
    await wait();
    expect(errors.length).toBe(1);
    sub.unsubscribe(); db.close();
  });
});
