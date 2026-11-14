import { describe, expect, it } from 'vitest';
import { collectionTags, copyOfNote, hasTag, matchesNote, sortCollections, sortNotes } from '../src/lib/collectionsView';

const c = (name: string, n: number, createdAt: number, updatedAt: number, tags?: string[]) => ({ name, items: Array.from({ length: n }, () => ({ type: 'catechism' as const, para: 1 })), createdAt, updatedAt, tags });

describe('organising collections and notes', () => {
  const list = [c('Mercy', 1, 1, 30, ['Lent']), c('apostles', 5, 3, 10, ['lent', 'Easter']), c('Zeal', 3, 2, 20)];
  it('sorts collections four ways, the same every time', () => {
    expect(sortCollections(list, 'updated').map((x) => x.name)).toEqual(['Mercy', 'Zeal', 'apostles']);
    expect(sortCollections(list, 'created').map((x) => x.name)).toEqual(['apostles', 'Zeal', 'Mercy']);
    expect(sortCollections(list, 'name').map((x) => x.name)).toEqual(['apostles', 'Mercy', 'Zeal']);
    expect(sortCollections(list, 'size').map((x) => x.name)).toEqual(['apostles', 'Zeal', 'Mercy']);
    expect(list[0].name).toBe('Mercy'); // the input is not reordered
  });
  it('lists each tag once and filters by it ignoring case', () => {
    expect(collectionTags(list)).toEqual(['Easter', 'Lent']);
    expect(list.filter((x) => hasTag(x, 'LENT')).map((x) => x.name)).toEqual(['Mercy', 'apostles']);
    expect(list.filter((x) => hasTag(x, '')).length).toBe(3);
  });
  it('finds notes by words in title, text, tag or what they point at', () => {
    const n = { title: 'Bread', body: 'He took the loaf', tags: ['mass'], targets: [{ type: 'catechism' as const, para: 1324 }] };
    const label = (t: { type: string }) => (t.type === 'catechism' ? 'CCC 1324' : '');
    expect(matchesNote(n, 'loaf bread', label)).toBe(true);
    expect(matchesNote(n, 'mass', label)).toBe(true);
    expect(matchesNote(n, 'ccc 1324', label)).toBe(true);
    expect(matchesNote(n, 'wine', label)).toBe(false);
  });
  it('sorts notes with pinned first, and copies a note without its pin or history', () => {
    const ns = [{ title: 'b', body: '', createdAt: 1, updatedAt: 5 }, { title: 'a', body: '', createdAt: 2, updatedAt: 1 }, { title: 'z', body: '', pinned: true, createdAt: 0, updatedAt: 0 }];
    expect(sortNotes(ns, 'title').map((x) => x.title)).toEqual(['z', 'a', 'b']);
    expect(sortNotes(ns, 'updated').map((x) => x.title)).toEqual(['z', 'b', 'a']);
    const cp = copyOfNote({ title: 'Bread', body: 'x', kind: 'note', targets: [{ type: 'passage', ref: 'JHN.6.51' }], tags: ['t'], folderId: 2 }, 9);
    expect(cp).toMatchObject({ title: 'Bread (copy)', tags: ['t'], folderId: 2, createdAt: 9 });
    expect(cp).not.toHaveProperty('pinned');
    expect(cp).not.toHaveProperty('history');
  });
});
