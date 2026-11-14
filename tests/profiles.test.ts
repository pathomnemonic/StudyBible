import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { findProfiles, validateProfiles, type Profile } from '../src/lib/profiles';

const src = { label: 'Catechism of the Catholic Church', kind: 'magisterium' as const };
const good: Profile = { id: 'thomas-aquinas', kind: 'saint', name: 'Thomas Aquinas', alternateNames: ['Tommaso d’Aquino'], feast: '01-28', period: { from: 1225, to: 1274 }, facts: [{ text: 'A Dominican friar and teacher.', source: src, confidence: 'certain' }] };

describe('profile data format', () => {
  it('the shipped file is valid (it starts empty: no facts are invented)', () => {
    const file = JSON.parse(readFileSync('public/data/profiles/profiles.json', 'utf8'));
    expect(validateProfiles(file)).toEqual([]);
  });
  it('accepts a sourced profile', () => {
    expect(validateProfiles({ version: 1, profiles: [good] })).toEqual([]);
  });
  it('rejects bare assertions and bad ids', () => {
    const errs = validateProfiles({ version: 1, profiles: [{ ...good, id: 'Bad Id' }, { ...good, id: 'x', facts: [] }, { ...good, id: 'y', facts: [{ text: 'A claim', source: { label: '', kind: 'historical' } }] }] });
    expect(errs.join('\n')).toMatch(/id must be/);
    expect(errs.join('\n')).toMatch(/at least one sourced fact/);
    expect(errs.join('\n')).toMatch(/needs a label/);
  });
  it('requires a place identification to say how sure it is', () => {
    const place: Profile = { id: 'capernaum', kind: 'place', name: 'Capernaum', facts: good.facts, identification: { modern: 'x', confidence: undefined as never, source: src } };
    expect(validateProfiles({ version: 1, profiles: [place] }).join()).toMatch(/how sure/);
  });
  it('checks feast format, period order, duplicates and dangling relations', () => {
    const errs = validateProfiles({ version: 1, profiles: [{ ...good, feast: '1-28', period: { from: 5, to: 1 }, related: [{ id: 'nobody', relation: 'student of', source: src }] }, good] }).join('\n');
    expect(errs).toMatch(/feast must be MM-DD/);
    expect(errs).toMatch(/starts after it ends/);
    expect(errs).toMatch(/not in the file/);
    expect(errs).toMatch(/used twice/);
  });
  it('finds by name or alternate name, ignoring accents and case', () => {
    expect(findProfiles([good], 'aquino')).toHaveLength(1);
    expect(findProfiles([good], 'THOMAS', 'place')).toHaveLength(0);
    expect(findProfiles([good], '')).toHaveLength(0);
  });
});

import { RELATIONS, relationGaps, validateProfileGraph } from '../src/lib/profiles';

// Profile relationships, structurally (audit item 8). No fact is judged; only the shape of the data.
describe('profile graph structure', () => {
  const file = () => JSON.parse(readFileSync('public/data/profiles/profiles.json', 'utf8'));
  const mk = (over: any[], base?: any) => ({ version: 1, profiles: over.map((o) => ({ ...good, kind: 'person', facts: good.facts, alternateNames: [], ...o })).concat(base ?? []) });
  it('the shipped data passes every structural rule', () => { expect(validateProfileGraph(file())).toEqual([]); });
  it('every relation label in the shipped data is in the allowed list', () => {
    for (const p of file().profiles) for (const r of p.related ?? []) expect(Object.keys(RELATIONS)).toContain(r.relation);
  });
  it('no relations at all is fine', () => { expect(validateProfileGraph(mk([{ id: 'a', name: 'A' }]) as any)).toEqual([]); });
  it('a self-link is an error', () => {
    expect(validateProfileGraph(mk([{ id: 'a', name: 'A', related: [{ id: 'a', relation: 'brother of', source: src }] }]) as any).join()).toMatch(/relates to itself/);
  });
  it('a repeated relation is an error; two different relations to one person are fine', () => {
    const rel = { id: 'b', relation: 'brother of', source: src };
    expect(validateProfileGraph(mk([{ id: 'a', name: 'A', related: [rel, rel] }, { id: 'b', name: 'B' }]) as any).join()).toMatch(/listed twice/);
    expect(validateProfileGraph(mk([{ id: 'a', name: 'A', related: [rel, { ...rel, relation: 'companion of' }] }, { id: 'b', name: 'B' }]) as any)).toEqual([]);
  });
  it('an unknown relation label, and an empty one, are errors', () => {
    const e = validateProfileGraph(mk([{ id: 'a', name: 'A', related: [{ id: 'b', relation: 'frenemy of', source: src }, { id: 'b', relation: '', source: src }] }, { id: 'b', name: 'B' }]) as any).join('\n');
    expect(e).toMatch(/not in the list of allowed relations/);
    expect(e).toMatch(/has no label/);
  });
  it('a place cannot be anyone\'s brother', () => {
    const e = validateProfileGraph({ version: 1, profiles: [{ ...good, id: 'cana', kind: 'place', name: 'Cana', related: [{ id: 'b', relation: 'brother of', source: src }] }, { ...good, id: 'b', kind: 'place', name: 'B' }] } as any).join('\n');
    expect(e).toMatch(/a place cannot be/);
  });
  it('parent and child relations that loop are an error, and a long honest line is not', () => {
    const loop = mk([{ id: 'a', name: 'A', related: [{ id: 'b', relation: 'son of', source: src }] }, { id: 'b', name: 'B', related: [{ id: 'a', relation: 'son of', source: src }] }]);
    expect(validateProfileGraph(loop as any).join()).toMatch(/form a cycle/);
    const chain = mk(Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, related: i ? [{ id: `p${i - 1}`, relation: 'son of', source: src }] : [] })));
    expect(validateProfileGraph(chain as any)).toEqual([]);
  });
  it('one name for two profiles of the same kind is an error, unless it is a listed homonym; across kinds it is fine', () => {
    expect(validateProfileGraph(mk([{ id: 'a', name: 'A', alternateNames: ['Johnny'] }, { id: 'b', name: 'B', alternateNames: ['johnny'] }]) as any).join()).toMatch(/belongs to more than one person/);
    expect(validateProfileGraph(mk([{ id: 'a', name: 'A', alternateNames: ['Mariam'] }, { id: 'b', name: 'B', alternateNames: ['Mariam'] }]) as any)).toEqual([]);
    expect(validateProfileGraph({ version: 1, profiles: [{ ...good, id: 'a', kind: 'person', name: 'John', alternateNames: [] }, { ...good, id: 'b', kind: 'saint', name: 'John', alternateNames: [] }] } as any)).toEqual([]);
  });
  it('malformed passage references are errors', () => {
    expect(validateProfileGraph(mk([{ id: 'a', name: 'A', passages: ['John 3:16', 'JHN.3.16', 'MAT.16.13-19', ''] }]) as any).join('\n')).toMatch(/not well formed/);
  });
  it('relation gaps are reported (informational), not errors', () => {
    const gaps = relationGaps(file());
    expect(Array.isArray(gaps)).toBe(true);
    // the number of one-sided relations is tracked so it cannot grow unnoticed
    expect(gaps.length).toBeLessThanOrEqual(4); // four today (Elijah and Elisha, Andrew and John the Baptist, John and Peter, Luke and Paul); a new one-sided link must be a conscious choice
  });
});
