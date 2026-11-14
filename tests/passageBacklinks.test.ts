import { describe, expect, it } from 'vitest';
import { parseRefId } from '../src/lib/refs';
import { collectionsOnPassage, glossaryIn, libraryCitations, notesOnPassage, plansOnPassage, profilesOnPassage } from '../src/lib/passageBacklinks';

const r = parseRefId('JHN.6.51-58')!;
describe('passageBacklinks', () => {
  it('finds notes and collections on overlapping passages only', () => {
    const notes = [{ id: 1, targets: [{ type: 'passage', ref: 'JHN.6.55' }] }, { id: 2, targets: [{ type: 'passage', ref: 'JHN.5.1' }] }, { id: 3, targets: [{ type: 'note', uid: 'x' }] }] as never[];
    expect(notesOnPassage(notes as { targets: never[] }[], r)).toHaveLength(1);
    const cols = [{ name: 'a', items: [{ type: 'passage', ref: 'JHN.6' }, { type: 'passage', ref: 'JHN.6.52' }] }, { name: 'b', items: [{ type: 'passage', ref: 'MAT.1.1' }] }] as never[];
    const out = collectionsOnPassage(cols as { items: never[] }[], r);
    expect(out).toHaveLength(1);
    expect(out[0].count).toBe(2);
  });
  it('finds plan days, library works, profiles and glossary words', () => {
    expect(plansOnPassage([{ id: 'p', name: 'P', days: [{ refs: ['GEN.1'] }, { refs: ['JHN.6'] }] }], r)).toEqual([{ id: 'p', name: 'P', days: [2] }]);
    const lib = libraryCitations([[6, 51, 6, 51, 'w1', 3, 't'], [6, 52, 6, 52, 'w1', 1, 't'], [5, 1, 5, 2, 'w2', 0, 's']], r);
    expect(lib).toEqual([{ workId: 'w1', sections: [1, 3] }]);
    expect(profilesOnPassage([{ passages: ['JHN.6.1-15'] }, { passages: ['JHN.6.50-52'] }, {}], r)).toHaveLength(1);
    expect(glossaryIn('the Eucharist and bread, Eucharist', (w) => (w === 'Eucharist' ? { term: 'Eucharist' } : undefined))).toEqual([{ term: 'Eucharist' }]);
  });
});
