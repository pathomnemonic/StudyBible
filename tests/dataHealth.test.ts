import { describe, expect, it } from 'vitest';
import { dataHealth } from '../src/lib/dataHealth';

const empty = { notes: [], highlights: [], bookmarks: [], collections: [], userPlans: [] };
describe('local data health check', () => {
  it('finds nothing wrong in healthy data', () => {
    expect(dataHealth({ ...empty, notes: [{ id: 1, uid: 'n1', body: 'x', targets: [{ type: 'passage', ref: 'JHN.6.51' }] }], collections: [{ id: 1, name: 'C', items: [{ type: 'note', uid: 'n1' }, { type: 'passage', ref: 'JHN.6.51-58' }] }] })).toEqual([]);
  });
  it('reports collection items whose note, highlight or bookmark is gone, naming the collection', () => {
    const f = dataHealth({ ...empty, collections: [{ id: 7, name: 'Bread', items: [{ type: 'note', uid: 'gone', label: 'My note' }, { type: 'highlight', uid: 'h' }] }] });
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ where: 'Collection “Bread”', to: '/collection/7' });
    expect(f[0].what).toContain('“My note”');
  });
  it('reports unreadable passage addresses on notes, highlights, bookmarks, collections and plans', () => {
    const f = dataHealth({
      notes: [{ id: 2, uid: 'a', title: 'T', body: '', targets: [{ type: 'passage', ref: 'nonsense' }] }],
      highlights: [{ uid: 'h', ref: 'bad' }], bookmarks: [{ uid: 'b', ref: 'bad2' }],
      collections: [{ id: 1, name: 'C', items: [{ type: 'passage', ref: 'zzz' }] }],
      userPlans: [{ id: 3, name: 'P', days: [{ refs: ['JHN.1.1'] }, { refs: ['oops'] }] }],
    });
    expect(f.map((x) => x.where)).toEqual(['Note “T”', 'A highlight', 'A bookmark', 'Collection “C”', 'Reading plan “P”']);
    expect(f[4].what).toContain('1 day ');
  });
});
