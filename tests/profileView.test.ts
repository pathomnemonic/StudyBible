import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Profile } from '../src/lib/profiles';
import { extendTrail, placePoint, profileByName, profilePath, relatedEntries, searchProfiles, shareTheirPassages } from '../src/lib/profileView';

const src = { label: 'x', kind: 'historical' as const };
const mk = (o: Partial<Profile> & { id: string }): Profile => ({ kind: 'person', name: o.id, facts: [{ text: 't', source: src }], ...o });
const real: Profile[] = JSON.parse(readFileSync('public/data/profiles/profiles.json', 'utf8')).profiles;

describe('profile search', () => {
  it('finds by alternate name, accent-insensitively, and reports which alias matched', () => {
    const hits = searchProfiles(real, 'cephas');
    expect(hits.find((h) => h.profile.id === 'peter')?.via).toBe('Cephas');
    expect(searchProfiles([mk({ id: 'a', name: 'José' })], 'jose')).toHaveLength(1);
  });
  it('ranks exact before prefix before contains; empty query lists the kind', () => {
    const l = [mk({ id: 'a', name: 'Johnson' }), mk({ id: 'b', name: 'John' }), mk({ id: 'c', name: 'St John', kind: 'saint' })];
    expect(searchProfiles(l, 'john').map((h) => h.profile.id)).toEqual(['b', 'a', 'c']);
    expect(searchProfiles(l, '', 'saint').map((h) => h.profile.id)).toEqual(['c']);
    expect(searchProfiles(l, 'zzz')).toEqual([]);
  });
  it('profileByName needs an exact, unambiguous name', () => {
    const l = [mk({ id: 'a', name: 'Simon', alternateNames: ['Peter'] }), mk({ id: 'b', name: 'Simon' })];
    expect(profileByName(l, 'Peter')?.id).toBe('a');
    expect(profileByName(l, 'Simon')).toBeUndefined();
    expect(profileByName(l, 'Pete')).toBeUndefined();
  });
});

describe('related records', () => {
  const a = mk({ id: 'a', passages: ['JHN.1'], related: [{ id: 'b', relation: 'mother of', source: src }, { id: 'gone', relation: 'wife of', source: src }] });
  const b = mk({ id: 'b', passages: ['JHN.1', 'LUK.1'] });
  it('keeps a missing target (no profile) so the page can say so, and shows incoming links from the other side', () => {
    const out = relatedEntries(a, [a, b]);
    expect(out.find((e) => e.id === 'gone')).toMatchObject({ relation: 'wife of', profile: undefined });
    const inc = relatedEntries(b, [a, b]);
    expect(inc).toEqual([expect.objectContaining({ id: 'a', relation: 'mother of', direction: 'incoming' })]);
  });
  it('does not list a link twice when the other end says it back', () => {
    const c = mk({ id: 'c', related: [{ id: 'd', relation: 'father of', source: src }] });
    const d = mk({ id: 'd', related: [{ id: 'c', relation: 'son of', source: src }] });
    expect(relatedEntries(c, [c, d])).toHaveLength(1);
  });
  it('lists profiles that share an exact passage', () => {
    expect(shareTheirPassages(a, [a, b])).toEqual([{ profile: b, passages: ['JHN.1'] }]);
    expect(shareTheirPassages(mk({ id: 'z' }), [a, b])).toEqual([]);
  });
});

describe('places on a map', () => {
  const pl = [{ n: 'Cana', lat: 1, lon: 2 }, null, { n: 'Dup', lat: 1, lon: 1 }, { n: 'Dup', lat: 5, lon: 5 }];
  it('uses a single exact name (or alternate) and never guesses', () => {
    expect(placePoint(mk({ id: 'c', kind: 'place', name: 'Cana' }), pl)).toMatchObject({ lat: 1, lon: 2 });
    expect(placePoint(mk({ id: 'c', kind: 'place', name: 'Kana', alternateNames: ['cana'] }), pl)).toMatchObject({ lat: 1 });
    expect(placePoint(mk({ id: 'd', kind: 'place', name: 'Dup' }), pl)).toBeNull();
    expect(placePoint(mk({ id: 'e', kind: 'place', name: 'Nowhere' }), pl)).toBeNull();
    expect(placePoint(mk({ id: 'p', kind: 'person', name: 'Cana' }), pl)).toBeNull();
  });
  it('some shipped places have a point, and no person does', () => {
    const places = JSON.parse(readFileSync('public/data/maps/places.json', 'utf8'));
    expect(real.filter((p) => placePoint(p, places)).length).toBeGreaterThan(10);
  });
});

describe('trail and paths', () => {
  it('extends without mutating and stays short', () => {
    const t1 = extendTrail(undefined, { path: '/a', label: 'A' });
    const t2 = extendTrail(t1, { path: '/b', label: 'B' });
    expect(t2.prev).toEqual(t1);
    expect(t1.prev).toBeUndefined();
    let t = t2; for (let i = 0; i < 20; i++) t = extendTrail(t, { path: `/x${i}`, label: 'x' });
    let n = 0; for (let x: typeof t | undefined = t; x; x = x.prev) n++;
    expect(n).toBe(8);
  });
  it('has a stable link per profile', () => { expect(profilePath({ kind: 'saint', id: 'peter' })).toBe('/study/profile/saint/peter'); });
});
