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
