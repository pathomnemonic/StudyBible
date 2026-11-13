import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('location', { origin: 'https://example.org' });

describe('collections', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });

  it('reorders items without losing any', async () => {
    const { moveItem } = await import('../src/lib/collections');
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });

  it('points at a note by identity: nothing is copied, and the link survives a backup and restore', async () => {
    const { db } = await import('../src/db/db');
    const ops = await import('../src/db/ops');
    const nid = await db.notes.add({ kind: 'note', title: 'On the bread of life', body: 'Jesus says...', targets: [], tags: [], chapterKeys: [], createdAt: 1, updatedAt: 1 } as never);
    const note = (await db.notes.get(nid))!;
    expect(note.uid).toBeTruthy();
    await db.collections.add({ name: 'Eucharist', items: [{ type: 'note', uid: note.uid! }, { type: 'link', url: 'https://example.org/x', label: 'A source' }], createdAt: 1, updatedAt: 1 } as never);
    expect(await db.notes.count()).toBe(1); // adding it to a collection made no second note
    const backup = await ops.exportAll();
    await db.delete(); vi.resetModules();
    const fresh = await import('../src/db/db');
    const ops2 = await import('../src/db/ops');
    await ops2.importAll(backup, 'replace');
    const c = (await fresh.db.collections.toArray())[0];
    const back = await fresh.db.notes.where('uid').equals((c.items[0] as { uid: string }).uid).first();
    expect(back?.title).toBe('On the bread of life');
  });

  it('exports Markdown with the text and a link back to each original', async () => {
    const { collectionMarkdown } = await import('../src/lib/collections');
    const md = collectionMarkdown(
      { name: 'Bread of life', description: 'John 6', items: [], createdAt: 1, updatedAt: 1 } as never,
      [
        { index: 0, target: { type: 'passage', ref: 'JHN.6.35' }, kind: 'Passage', title: 'John 6:35', text: 'I am the bread of life.', to: '/read/webc/JHN/6?v=35' },
        { index: 1, target: { type: 'link', url: 'https://example.org/x', label: 'A source' }, kind: 'Link', title: 'A source', url: 'https://example.org/x' },
        { index: 2, target: { type: 'note', uid: 'gone' }, kind: 'Note', title: 'Gone', missing: true },
      ],
    );
    expect(md).toMatch(/^# Bread of life/);
    expect(md).toContain('> I am the bread of life.');
    expect(md).toContain('[Open the original](https://example.org');
    expect(md).toContain('/#/read/webc/JHN/6?v=35');
    expect(md).toContain('[Open the original](https://example.org/x)');
    expect(md).toContain('the original is no longer here');
  });
});
