import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), get length() { return store.size; }, key: (i: number) => [...store.keys()][i] ?? null });

import { stampsFor, councilFromText, councilPins, validMd } from '../src/lib/passportMap';

describe('passport URL map', () => {
  const at = new Date(2026, 10, 8);
  it('maps pages to stamps', () => {
    expect(stampsFor('/study/arguments/papal-primacy')).toEqual([{ kind: 'argument', id: 'papal-primacy', label: 'Papal primacy' }]);
    expect(stampsFor('/study/lives/teresa-of-avila')[0]).toMatchObject({ kind: 'life', id: 'teresa-of-avila' });
    expect(stampsFor('/study/saints/03-17')[0]).toMatchObject({ kind: 'saint', id: '03-17' });
    expect(stampsFor('/study/saints/13-40')).toEqual([]);
    expect(stampsFor('/study/councils', '?n=3')[0]).toMatchObject({ kind: 'council', id: '3' });
    expect(stampsFor('/study/councils', '?n=99')).toEqual([]);
    expect(stampsFor('/s/feast/christmas')[0]).toMatchObject({ kind: 'feast', id: 'christmas' });
    expect(stampsFor('/play/trivia')[0]).toMatchObject({ kind: 'game', id: 'trivia' });
    expect(stampsFor('/play/ABC123')).toEqual([]);
    expect(stampsFor('/pray/readings', '', at)[0]).toMatchObject({ kind: 'readings', id: '2026-11-08' });
    expect(stampsFor('/pray/readings/2026-12-25')[0].id).toBe('2026-12-25');
    expect(stampsFor('/room/work/confessions/book-1')[0]).toMatchObject({ kind: 'work', id: 'confessions' });
    expect(stampsFor('/study/catechism/2558')[0].label).toBe('Catechism §2558');
    expect(stampsFor('/study')[0]).toMatchObject({ kind: 'hub', id: 'study' });
    expect(stampsFor('/settings')).toEqual([]);
  });
  it('reads council buttons and pins', () => {
    expect(councilFromText('4. Chalcedon')).toBe(4);
    expect(councilFromText('Chalcedon')).toBeNull();
    const pins = councilPins(new Set(['1', '7']));
    expect(pins.find((p) => p.place === 'Nicaea')!.got).toEqual([1, 7]);
    expect(pins.find((p) => p.place === 'Rome')!.councils.length).toBe(7);
    expect(validMd('02-29')).toBe(true);
    expect(validMd('02-30')).toBe(false);
  });
});

describe('passport store', () => {
  beforeEach(() => { store.clear(); vi.resetModules(); });
  it('stamps once, keeps the first date, resets, and tolerates damage', async () => {
    const p = await import('../src/lib/passport');
    expect(p.stamp('council', '1', 'Nicaea I', 1000)).toBe(true);
    expect(p.stamp('council', '1', 'Nicaea I', 2000)).toBe(false);
    expect(p.allStamps()).toEqual([{ k: 'council', i: '1', l: 'Nicaea I', t: 1000 }]);
    p.resetPassport();
    expect(p.allStamps()).toEqual([]);
    store.set('sb:passport', '{not json');
    expect(p.allStamps()).toEqual([]);
    store.set('sb:passport', JSON.stringify({ v: 1, s: { a: { k: 'bogus', i: 'x', l: 'x', t: 1 } } }));
    expect(p.allStamps()).toEqual([]);
  });
  it('caps the book, dropping the least special stamps first', async () => {
    const p = await import('../src/lib/passport');
    p.stamp('council', '1', 'Nicaea I', 1);
    for (let i = 0; i < p.MAX_STAMPS + 5; i++) p.stamp('readings', `d${i}`, 'r', 10 + i);
    const all = p.allStamps();
    expect(all.length).toBe(p.MAX_STAMPS);
    expect(all.some((s) => s.k === 'council')).toBe(true);
  });
  it('merges two passports keeping the earlier date', async () => {
    const p = await import('../src/lib/passport');
    const a = { v: 1, s: { 'game:trivia': { k: 'game', i: 'trivia', l: 'Trivia', t: 50 } } };
    const b = { v: 1, s: { 'game:trivia': { k: 'game', i: 'trivia', l: 'Trivia', t: 20 }, 'hub:pray': { k: 'hub', i: 'pray', l: 'Pray', t: 30 } } };
    const m = p.mergeBooks(a, b);
    expect(m.s['game:trivia'].t).toBe(20);
    expect(Object.keys(m.s).length).toBe(2);
  });
});

describe('Move my place round trip', () => {
  beforeEach(async () => { const D = (await import('dexie')).default; await D.delete('studybible'); store.clear(); vi.resetModules(); });
  it('exports, validates, and merges without overwriting', async () => {
    const { db } = await import('../src/db/db');
    const mp = await import('../src/lib/movePlace');
    const pass = await import('../src/lib/passport');
    await db.open();
    await db.planProgress.put({ planId: 'biay', startedAt: 5, status: 'active', done: [0, 1, 2], offsetDays: 0 } as never);
    await db.memory.add({ ref: 'JHN.3.16', ease: 2.5, interval: 6, reps: 4, lapses: 0, due: 9, createdAt: 1 } as never);
    await db.cache.put({ key: 'daily-fav:2026-03-01', value: 'A day', ts: 1 });
    store.set('sb:slowBible', JSON.stringify({ start: '2026-01-01', done: [0, 1] }));
    store.set('sb:plays:v1', JSON.stringify({ days: [1, 2], games: { trivia: 2 }, perfect: {}, dailyByDay: {} }));
    store.set('sb:trophies:v1', JSON.stringify({ first: 100 }));
    pass.stamp('hub', 'pray', 'Pray', 10);
    const placeA = await mp.collectPlace();
    const code = await mp.placeToCode(placeA);
    expect(code.startsWith('SBP')).toBe(true);
    const back = await mp.readPlace(code);
    expect(back.plans![0].done).toEqual([0, 1, 2]);
    expect(await mp.readPlace(JSON.stringify(placeA))).toEqual(back);

    // a "new phone" with some of its own progress
    await db.planProgress.clear(); await db.memory.clear(); await db.cache.clear(); store.clear();
    await db.planProgress.put({ planId: 'biay', startedAt: 99, status: 'active', done: [2, 3], offsetDays: 1 } as never);
    store.set('sb:slowBible', JSON.stringify({ start: '2026-01-01', done: [5] }));
    store.set('sb:plays:v1', JSON.stringify({ days: [2, 3], games: { trivia: 5 }, perfect: {}, dailyByDay: {} }));
    pass.stamp('game', 'chain', 'Chain', 40);
    const done = await mp.applyPlace(back, ['plans', 'memory', 'slow', 'passport', 'games', 'favs']);
    expect(done.length).toBe(6);
    const plan = await db.planProgress.get('biay');
    expect(plan!.done).toEqual([0, 1, 2, 3]);
    expect(plan!.startedAt).toBe(99);
    expect(plan!.offsetDays).toBe(1);
    expect((await db.memory.toArray()).length).toBe(1);
    expect(JSON.parse(store.get('sb:slowBible')!).done).toEqual([0, 1, 5]);
    expect(JSON.parse(store.get('sb:plays:v1')!)).toMatchObject({ days: [1, 2, 3], games: { trivia: 5 } });
    expect(JSON.parse(store.get('sb:trophies:v1')!)).toEqual({ first: 100 });
    expect(pass.allStamps().map((s) => s.i).sort()).toEqual(['chain', 'pray']);
    expect((await db.cache.get('daily-fav:2026-03-01'))!.value).toBe('A day');
    // unticked sections are left alone
    const before = store.get('sb:slowBible');
    await mp.applyPlace(back, []);
    expect(store.get('sb:slowBible')).toBe(before);
  });
  it('rejects things that are not place files', async () => {
    const mp = await import('../src/lib/movePlace');
    await expect(mp.readPlace('hello')).rejects.toThrow();
    await expect(mp.readPlace('{"f":"other"}')).rejects.toThrow(/not a/);
    await expect(mp.readPlace('SBP1.@@@')).rejects.toThrow();
    const p = mp.parsePlace(JSON.stringify({ f: 'studybible-place', v: 1, plans: [{ planId: 3 }, { planId: 'x', done: [1, -1, 'a'] }], setup: { theme: 'dark', evil: 1 } }));
    expect(p.plans).toHaveLength(1);
    expect(p.plans![0].done).toEqual([1]);
    expect(p.setup).toEqual({ theme: 'dark' });
  });
});
