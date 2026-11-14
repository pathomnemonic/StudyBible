// Sync conflict resolution (audit item 2): edits that differ only in metadata must not be lost, copies get stable ids,
// a delete never silently destroys an edit, and a delete is not undone by an older copy from another device.
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { conflictUid, hasContent, resolveConflict } from '../src/sync/merge';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

const base = { kind: 'note', title: 'T', body: 'same body', tags: ['a'], targets: [], chapterKeys: [], createdAt: 1, uid: 'n1' };
let dbm: typeof import('../src/db/db');
let eng: typeof import('../src/sync/engine');

beforeEach(async () => {
  await Dexie.delete('studybible'); vi.resetModules(); store.clear();
  dbm = await import('../src/db/db'); eng = await import('../src/sync/engine');
  store.set('studybible.sync.u.lastPush', '1000'); // everything with updatedAt > 1000 is unsynced here
});
const remote = (over: any, at = 3000, table = 'notes', uid = 'n1') => ({ table, uid, updatedAt: at, payload: { ...base, ...over, updatedAt: at } as any });
const notes = () => dbm.db.notes.toArray();
/** put a row in exactly as written (the database stamps updatedAt on ordinary writes; sync applies remote rows without that) */
const patchRow = async (uid: string, patch: any) => { dbm.syncFlags.applying = true; try { await dbm.db.notes.where('uid').equals(uid).modify(patch); } finally { dbm.syncFlags.applying = false; } };
const seed = async (table: 'notes' | 'journal', row: any) => { dbm.syncFlags.applying = true; try { return await (dbm.db as any)[table].add(row); } finally { dbm.syncFlags.applying = false; } };

describe('field-level merge (pure)', () => {
  it('joins tags and keeps a pin', () => {
    const r = resolveConflict('notes', { ...base, tags: ['a', 'b'], pinned: true }, { ...base, tags: ['a', 'c'] });
    expect(r.merged.tags).toEqual(['a', 'c', 'b']);
    expect(r.merged.pinned).toBe(true);
    expect(r.copy).toBeNull(); // nothing was lost, so no copy
  });
  it('a differing title is kept as a copy, with a stable id', () => {
    const a = resolveConflict('notes', { ...base, title: 'Mine' }, { ...base, title: 'Theirs' });
    const b = resolveConflict('notes', { ...base, title: 'Mine' }, { ...base, title: 'Theirs' }, 999999);
    expect(a.merged.title).toBe('Theirs');
    expect(a.copy?.title).toContain('Mine');
    expect(a.copy?.uid).toBe(b.copy?.uid);
    expect(a.copy?.uid).toBe(conflictUid('n1', { title: 'Mine' }));
  });
  it('empty values are the same as missing ones (no false conflicts)', () => {
    const r = resolveConflict('notes', { ...base, pinned: false, tags: [], revisitAt: undefined }, { ...base, tags: [], pinned: undefined, revisitAt: null });
    expect(r.differing).toEqual([]);
    expect(r.copy).toBeNull();
  });
  it('answered stays answered; journal refs join', () => {
    const r = resolveConflict('journal', { uid: 'j', kind: 'intention', date: 'd', body: 'b', refs: ['x'], answered: true }, { uid: 'j', kind: 'intention', date: 'd', body: 'b', refs: ['y'], answered: false });
    expect(r.merged.answered).toBe(true);
    expect(r.merged.refs).toEqual(['y', 'x']);
    expect(r.copy).toBeNull();
  });
  it('hasContent counts a title-only or tags-only record', () => {
    expect(hasContent({ body: '', title: 'x' })).toBe(true);
    expect(hasContent({ body: ' ', tags: ['t'] })).toBe(true);
    expect(hasContent({ body: ' ' })).toBe(false);
  });
});

describe('applying a remote change that conflicts with an unsynced local edit', () => {
  const metadataCases: [string, any, any][] = [
    ['title', { title: 'Local title' }, { title: 'Remote title' }],
    ['kind', { kind: 'question' }, { kind: 'prayer-note' }],
    ['revisit date', { revisitAt: 111 }, { revisitAt: 222 }],
    ['targets', { targets: [{ type: 'passage', ref: 'JHN.1.1' }] }, { targets: [{ type: 'passage', ref: 'JHN.1.2' }] }],
    ['folder', { folderId: 1 }, { folderUid: 'f-remote' }],
    ['origin edition', { originEdition: 'web' }, { originEdition: 'rsv' }],
  ];
  for (const [name, local, rem] of metadataCases) {
    it(`same body, different ${name}: both versions survive`, async () => {
      await seed('notes', { ...base, ...local, updatedAt: 2000 } as any);
      await eng.applyRemote('u', [remote(rem)]);
      const all = await notes();
      expect(all.length).toBe(2); // the winner plus the kept copy
      const copy = all.find((n) => n.uid !== 'n1')!;
      expect(copy.uid).toContain('~conflict~');
      const winner = all.find((n) => n.uid === 'n1')!;
      expect(winner.updatedAt).toBe(3000);
    });
  }
  it('same body, pinned on one device only: pinned wins, and no copy is made', async () => {
    await seed('notes', { ...base, pinned: true, updatedAt: 2000 } as any);
    await eng.applyRemote('u', [remote({})]);
    const all = await notes();
    expect(all.length).toBe(1);
    expect(all[0].pinned).toBe(true);
  });
  it('tags edited on both devices are joined', async () => {
    await seed('notes', { ...base, tags: ['a', 'local'], updatedAt: 2000 } as any);
    await eng.applyRemote('u', [remote({ tags: ['a', 'remote'] })]);
    const all = await notes();
    expect(all.length).toBe(1);
    expect(new Set(all[0].tags)).toEqual(new Set(['a', 'local', 'remote']));
  });
  it('syncing the same conflict again adds nothing (stable copy id)', async () => {
    await seed('notes', { ...base, title: 'Local title', updatedAt: 2000 } as any);
    await eng.applyRemote('u', [remote({ title: 'Remote title' })]);
    const after1 = (await notes()).length;
    // the same remote change delivered again (an interrupted batch, a retry): older or equal, nothing happens
    await eng.applyRemote('u', [remote({ title: 'Remote title' })]);
    expect((await notes()).length).toBe(after1);
    // and a later re-delivery with a newer stamp finds the existing copy instead of making a second one
    await dbm.db.notes.where('uid').equals('n1').modify({ title: 'Local title', updatedAt: 2500 });
    await eng.applyRemote('u', [remote({ title: 'Remote title' }, 3500)]);
    expect((await notes()).filter((n) => (n.uid ?? '').includes('~conflict~')).length).toBe(1);
  });
  it('a body difference still keeps the other text (as before)', async () => {
    await seed('notes', { ...base, body: 'local words', updatedAt: 2000 } as any);
    await eng.applyRemote('u', [remote({ body: 'remote words' })]);
    const all = await notes();
    expect(all.map((n) => n.body).sort()).toEqual(['local words', 'remote words']);
  });
  it('journal: kind and answered state conflicts', async () => {
    await seed('journal', { uid: 'j1', date: '2026-01-01', kind: 'intention', body: 'pray', refs: [], answered: false, createdAt: 1, updatedAt: 2000 } as any);
    await eng.applyRemote('u', [{ table: 'journal', uid: 'j1', updatedAt: 3000, payload: { date: '2026-01-01', kind: 'prayer', body: 'pray', refs: [], answered: true, createdAt: 1, updatedAt: 3000 } }]);
    const all = await dbm.db.journal.toArray();
    expect(all.find((j) => j.uid === 'j1')!.answered).toBe(true);
    expect(all.length).toBe(2); // 'intention' vs 'prayer' could not be joined: the local kind is kept as a copy
  });
  it('a local edit older than the last push is simply replaced (no conflict)', async () => {
    await seed('notes', { ...base, title: 'Old local', updatedAt: 500 } as any);
    await eng.applyRemote('u', [remote({ title: 'Remote' })]);
    const all = await notes();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe('Remote');
  });
});

describe('edit and delete', () => {
  it('delete on the other device, edit here: the edit is kept (a title-only note too)', async () => {
    await seed('notes', { ...base, body: '', title: 'Only a title', updatedAt: 2000 } as any);
    await eng.applyRemote('u', [{ table: 'notes', uid: 'n1', updatedAt: 1500, deleted: true, payload: {} }]);
    expect((await notes()).length).toBe(1);
  });
  it('delete on the other device, nothing here edited: deleted', async () => {
    await seed('notes', { ...base, updatedAt: 500 } as any);
    await eng.applyRemote('u', [{ table: 'notes', uid: 'n1', updatedAt: 3000, deleted: true, payload: {} }]);
    expect((await notes()).length).toBe(0);
  });
  it('deleted here, an older copy arrives from another device: it stays deleted', async () => {
    const id = await seed('notes', { ...base, updatedAt: 1500 } as any);
    await dbm.db.notes.delete(id);
    const tomb = await dbm.db.tombs.filter((t) => t.uid === 'n1').first();
    expect(tomb).toBeTruthy();
    await eng.applyRemote('u', [remote({}, Math.max(1, tomb!.updatedAt - 1))]);
    expect((await notes()).length).toBe(0);
  });
  it('deleted here, a newer edit arrives from another device: the edit comes back', async () => {
    const id = await seed('notes', { ...base, updatedAt: 1500 } as any);
    await dbm.db.notes.delete(id);
    const tomb = await dbm.db.tombs.filter((t) => t.uid === 'n1').first();
    await eng.applyRemote('u', [remote({ title: 'edited after' }, tomb!.updatedAt + 5000)]);
    expect((await notes()).length).toBe(1);
  });
});

import { canonical } from '../src/lib/canonical';
import { doneKeyMatches } from '../src/lib/collections';

describe('nested conflict identity (audit second pass, item 2)', () => {
  const t = (ref: string) => ({ targets: [{ type: 'passage', ref }] });
  it('different nested target values give different conflict ids (they used to collide)', () => {
    expect(conflictUid('n1', t('JHN.1.1'))).not.toBe(conflictUid('n1', t('JHN.1.3')));
    expect(conflictUid('n1', t('JHN.1.1'))).not.toBe(conflictUid('n1', { targets: [{ type: 'passage', ref: 'JHN.1.1' }, { type: 'passage', ref: 'JHN.1.2' }] }));
  });
  it('the canonical form sorts keys at every level, keeps array order, and treats empties as one value', () => {
    expect(canonical({ b: 1, a: { d: [2, 1], c: 3 } })).toBe(canonical({ a: { c: 3, d: [2, 1] }, b: 1 }));
    expect(canonical([1, 2])).not.toBe(canonical([2, 1]));
    expect(canonical({ a: [], b: '', c: null, d: undefined, e: false })).toBe(canonical({}));
    expect(canonical({ a: { x: 1 } })).not.toBe(canonical({ a: { x: 2 } }));
  });
  it('reordering object properties without changing values is not a conflict', () => {
    const a = { ...base, targets: [{ type: 'passage', ref: 'JHN.1.1' }] };
    const b = { ...base, targets: [{ ref: 'JHN.1.1', type: 'passage' }] };
    const r = resolveConflict('notes', a, b);
    expect(r.differing).toEqual([]);
    expect(r.copy).toBeNull();
  });
  it('different nested metadata values give different stable ids; the same values give the same id', () => {
    const a = conflictUid('n1', { targets: [{ type: 'passage', ref: 'JHN.1.1', label: 'A' }] });
    expect(a).not.toBe(conflictUid('n1', { targets: [{ type: 'passage', ref: 'JHN.1.1', label: 'B' }] }));
    expect(a).toBe(conflictUid('n1', { targets: [{ label: 'A', ref: 'JHN.1.1', type: 'passage' }] }));
  });
  it('two distinct target conflicts on the same note both survive applyRemote()', async () => {
    await seed('notes', { ...base, targets: [{ type: 'passage', ref: 'JHN.1.1' }], updatedAt: 2000 } as any);
    await eng.applyRemote('u', [remote({ targets: [{ type: 'passage', ref: 'JHN.1.2' }] }, 3000)]);
    // the same note is edited again here, then a second remote conflict arrives with a different remote value
    await patchRow('n1', { targets: [{ type: 'passage', ref: 'JHN.1.3' }], updatedAt: 3500 });
    await eng.applyRemote('u', [remote({ targets: [{ type: 'passage', ref: 'JHN.1.4' }] }, 4000)]);
    const copies = (await notes()).filter((n) => (n.uid ?? '').includes('~conflict~'));
    expect(copies.length).toBe(2);
    expect(new Set(copies.map((c) => c.uid)).size).toBe(2);
    expect(copies.map((c) => c.targets[0].ref).sort()).toEqual(['JHN.1.1', 'JHN.1.3']);
  });
  it('applying the exact same conflict again does not duplicate it', async () => {
    await seed('notes', { ...base, targets: [{ type: 'passage', ref: 'JHN.1.1' }], updatedAt: 2000 } as any);
    await eng.applyRemote('u', [remote({ targets: [{ type: 'passage', ref: 'JHN.1.2' }] }, 3000)]);
    await patchRow('n1', { targets: [{ type: 'passage', ref: 'JHN.1.1' }], updatedAt: 3200 });
    await eng.applyRemote('u', [remote({ targets: [{ type: 'passage', ref: 'JHN.1.2' }] }, 3300)]);
    expect((await notes()).filter((n) => (n.uid ?? '').includes('~conflict~')).length).toBe(1);
  });
  it('a third device reaching the same conflict derives the same id', () => {
    const lost = { targets: [{ type: 'passage', ref: 'JHN.1.1' }] };
    expect(resolveConflict('notes', { ...base, ...lost }, { ...base, targets: [{ type: 'passage', ref: 'JHN.1.2' }] }, 111).copy?.uid)
      .toBe(resolveConflict('notes', { ...base, ...lost }, { ...base, targets: [{ ref: 'JHN.1.2', type: 'passage' }] }, 999).copy?.uid);
  });
  it('a collection\'s done mark still matches its item when the keys were written in another order', () => {
    expect(doneKeyMatches(JSON.stringify({ type: 'passage', ref: 'JHN.1.1' }), { ref: 'JHN.1.1', type: 'passage' })).toBe(true);
    expect(doneKeyMatches(JSON.stringify({ type: 'passage', ref: 'JHN.1.1' }), { type: 'passage', ref: 'JHN.1.2' })).toBe(false);
    expect(doneKeyMatches('not json', {})).toBe(false);
  });
});
