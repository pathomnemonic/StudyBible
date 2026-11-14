import { describe, expect, it } from 'vitest';
import { loadKnown } from '../scripts/curriculum/lessonData';
import { checkRefIn, pooledCounts, readerUrl, resolveRef, type CountsEdition } from '../src/lib/refCheck';
import { parseRefs, refId, type Ref } from '../src/lib/refs';
import { readerPath } from '../src/lib/nav';
import { buildGoFurther, keyVerse, refContext, type Known } from '../src/curriculum/goFurther';
import type { EditionRecord } from '../src/data/loader';

const known: Known = loadKnown(); // also loads the verse-mapping data, as the app does
const eds = known.editions as CountsEdition[];
const ed = (id: string) => eds.find((e) => e.id === id)!;
const webc = ed('webc');
const dra = ed('dra');
const brenton = ed('brenton'); // Old Testament only
const english = pooledCounts(eds, 'english')!;
const R = (s: string): Ref => { const p = parseRefs(s); if (!p.ok) throw new Error(s); return p.refs[0].ref; };
const issue = (e: CountsEdition, s: string) => checkRefIn(e, R(s));

describe('checkRefIn: both endpoints, in the edition\'s own numbering', () => {
  it('accepts valid single verses, ranges, whole chapters and cross-chapter ranges', () => {
    for (const s of ['John 3:16', 'John 3:16-18', 'John 3', 'John 3:36-4:2', 'Psalm 23:1', 'Genesis 1:1-2:3']) expect(issue(webc, s), s).toBeNull();
  });
  it('rejects a verse past the end of its chapter (John 3 has 36 verses)', () => {
    expect(issue(webc, 'John 3:37')).toMatchObject({ kind: 'invalid', scope: 'verse' });
    expect(issue(webc, 'John 3:37')!.reason).toMatch(/36 verses/);
  });
  it('rejects a range whose END is past the chapter, even when the start is fine', () => {
    expect(issue(webc, 'John 3:30-37')).toMatchObject({ scope: 'verse' });
  });
  it('checks both ends of a cross-chapter range', () => {
    expect(issue(webc, 'John 3:16-4:99')).toMatchObject({ scope: 'verse' });
    expect(issue(webc, 'John 3:99-4:1')).toMatchObject({ scope: 'verse' });
  });
  it('rejects chapters that do not exist, alone or at the end of a range', () => {
    expect(checkRefIn(webc, { book: 'JHN', c1: 22, c2: 22 })).toMatchObject({ scope: 'chapter' });
    expect(checkRefIn(webc, { book: 'JHN', c1: 20, c2: 22 })).toMatchObject({ scope: 'chapter' });
    expect(checkRefIn(webc, { book: 'JHN', c1: 0, c2: 0 })).toMatchObject({ scope: 'chapter' });
  });
  it('rejects a range that runs backwards and a verse zero', () => {
    expect(checkRefIn(webc, { book: 'JHN', c1: 3, v1: 18, c2: 3, v2: 16 })).toMatchObject({ scope: 'verse' });
    expect(checkRefIn(webc, { book: 'JHN', c1: 3, v1: 0, c2: 3, v2: 0 })).toMatchObject({ scope: 'verse' });
  });
  it('says a book is absent when the edition does not contain it', () => {
    expect(issue(brenton, 'John 3:16')).toMatchObject({ kind: 'absent', scope: 'book' });
    expect(issue(brenton, 'Genesis 1:1')).toBeNull();
  });
  it('does not assume editions share verse counts: the same chapter differs between editions', () => {
    const e = { id: 'x', scheme: 'english', chapters: { JHN: 3 }, verseCounts: { JHN: [51, 25, 30] } };
    expect(checkRefIn(e, R('John 3:30'))).toBeNull();
    expect(checkRefIn(e, R('John 3:31'))).toMatchObject({ scope: 'verse' });
    expect(checkRefIn(webc, R('John 3:31'))).toBeNull(); // webc has 36
  });
  it('a verse cannot be confirmed when the edition has no verse counts for that chapter', () => {
    const e = { id: 'x', scheme: 'english', chapters: { JHN: 21 }, verseCounts: {} };
    expect(checkRefIn(e, R('John 3:16'))).toMatchObject({ kind: 'invalid' });
    expect(checkRefIn(e, R('John 3'))).toBeNull(); // a whole chapter needs no verse count
  });
  it('pools verse counts of one tradition to the largest, so a verse that exists in any of them is real', () => {
    for (const [b, arr] of Object.entries(english.verseCounts)) arr.forEach((n, i) => { for (const e of eds.filter((x) => x.scheme === 'english')) expect(n).toBeGreaterThanOrEqual(e.verseCounts[b]?.[i] ?? 0); });
    expect(pooledCounts(eds, 'no-such-scheme')).toBeNull();
  });
});

describe('resolveRef: carrying a passage between numbering schemes', () => {
  const go = (s: string, target = dra) => resolveRef(english, target, R(s), 'kjv', ed('dra'));

  it('a valid reference maps exactly through the whole path, and opens at the right verse', () => {
    const r = go('John 3:16');
    expect(r.status).toBe('exact');
    expect(refId(r.anchor!)).toBe('JHN.3.16');
    expect(readerUrl(dra, r.native!)).toBe('/read/dra/JHN/3?v=16');
    expect(readerUrl(webc, go('John 3:16', webc).native!)).toBe('/read/webc/JHN/3?v=16');
  });
  it('keeps the original reference and its scheme', () => {
    const r = go('John 3:16-18');
    expect(refId(r.original)).toBe('JHN.3.16-18');
    expect(r.sourceScheme).toBe('kjv');
  });
  it('Psalm numbering: English Ps 23:1 is Vulgate Ps 22:1, exactly', () => {
    const r = go('Psalm 23:1');
    expect(r.status).toBe('exact');
    expect(refId(r.anchor!)).toBe('PSA.22.1');
    expect(readerUrl(dra, r.native!)).toBe('/read/dra/PSA/22?v=1');
    expect(readerUrl(webc, go('Psalm 23:1', webc).native!)).toBe('/read/webc/PSA/23?v=1'); // same tradition: no conversion
  });
  it('split Psalms: English Ps 116:10-19 is Vulgate Ps 115:1-10', () => {
    const r = go('Psalm 116:10-19');
    expect(r.status).toBe('exact');
    expect(refId(r.anchor!)).toBe('PSA.115.1-10');
  });
  it('merged Psalms: English Ps 10 sits inside Vulgate Ps 9', () => {
    expect(refId(go('Psalm 10:1-18').anchor!)).toBe('PSA.9.22-39');
  });
  it('a cross-chapter range converts BOTH ends (English Ps 9:20-10:2 is Vulgate Ps 9:21-9:23)', () => {
    const a = go('Psalm 9:20-10:2').anchor!;
    expect(a).toMatchObject({ c1: 9, v1: 21, c2: 9, v2: 23 });
  });
  it('a chapter whose numbering is unverified is approximate, never exact, and says why', () => {
    const r = go('John 6:53');
    expect(r.status).toBe('approximate');
    expect(r.reason).toMatch(/numbering/i);
    expect(r.anchor).toBeDefined();
  });
  it('an invalid passage is invalid in every edition: nothing nearby is substituted', () => {
    for (const t of [dra, webc]) {
      const r = go('John 3:37', t);
      expect(r.status).toBe('invalid');
      expect(r.native).toBeUndefined();
    }
    expect(resolveRef(english, dra, { book: 'JHN', c1: 22, c2: 22 }).status).toBe('invalid');
  });
  it('a book the chosen edition lacks is absent, not redirected', () => {
    const r = resolveRef(english, brenton, R('John 3:16'), 'kjv', dra);
    expect(r.status).toBe('absent');
    expect(r.native).toBeUndefined();
  });
  it('2 Maccabees 12:46 exists only in the Vulgate numbering: approximate, opened at the chapter, no verse invented', () => {
    const r = go('2 Maccabees 12:44-46', webc);
    expect(r.status).toBe('approximate');
    expect(r.reason).toMatch(/Vulgate/);
    expect(readerUrl(webc, r.native!)).toBe('/read/webc/2MA/12');
    expect(go('2 Maccabees 12:44-46', dra).status).toBe('approximate'); // chapter flagged as unverified between traditions
    expect(go('2 Maccabees 12:99').status).toBe('invalid'); // not in the Vulgate numbering either
  });
  it('readerUrl and readerPath never clamp a chapter the edition does not have', () => {
    expect(readerUrl(webc, { book: 'JHN', c1: 99, c2: 99 })).toBeNull();
    expect(readerUrl(brenton, { book: 'JHN', c1: 3, c2: 3 })).toBeNull();
    expect(readerPath(webc as unknown as EditionRecord, { book: 'JHN', c1: 99, c2: 99 })).toBe('/read/webc/JHN/99');
  });
});

describe('go further links use the same checks', () => {
  const lesson = (scripture: string) => ({ id: 'x-1-1', scripture, ccc: '1-3' });
  const ctxFor = (id: string) => refContext(eds, id)!;
  it('links the exact verse in the chosen edition', () => {
    expect(buildGoFurther(lesson('John 3:16'), known, null, ctxFor('webc')).links[0].to).toBe('/read/webc/JHN/3?v=16');
    expect(buildGoFurther(lesson('Psalm 23:1'), known, null, ctxFor('dra')).links[0].to).toBe('/read/dra/PSA/22?v=1');
  });
  it('reports a verse past the end of the chapter as broken data, and offers no link for it', () => {
    const r = buildGoFurther(lesson('John 3:37'), known, null, ctxFor('webc'));
    expect(r.broken.join()).toMatch(/36 verses/);
    expect(r.links.filter((l) => l.kind === 'scripture')).toEqual([]);
  });
  it('checks the END of a range too', () => { expect(buildGoFurther(lesson('John 3:30-37'), known, null, ctxFor('webc')).broken).toHaveLength(1); });
  it('says so when the chosen edition lacks the book, instead of hiding it or opening another book', () => {
    const r = buildGoFurther(lesson('John 3:16'), known, null, ctxFor('brenton'));
    expect(r.links.filter((l) => l.kind === 'scripture')).toEqual([]);
    expect(r.unavailable[0]).toMatchObject({ label: 'John 3:16' });
    expect(r.broken).toEqual([]);
  });
  it('an unverified mapping keeps its link but carries a note; a same-tradition edition needs none', () => {
    const l = lesson('John 6:53');
    expect(buildGoFurther(l, known, null, ctxFor('dra')).links[0].note).toMatch(/numbering/i);
    expect(buildGoFurther(l, known, null, ctxFor('webc')).links[0].note).toBeUndefined();
  });
  it('2 Maccabees 12:44-46 links to the chapter with a note, not to a verse the edition lacks', () => {
    const k = buildGoFurther(lesson('2 Maccabees 12:44-46'), known, null, ctxFor('webc')).links[0];
    expect(k.to).toBe('/read/webc/2MA/12');
    expect(k.note).toBeDefined();
  });
});

describe('key verse for the memorize list', () => {
  const ctx = refContext(eds, 'webc')!;
  const kv = (cite: string) => keyVerse({ mem: `“Quoted words.” (${cite})` }, ctx);
  it('an exact mapping is offered, with the original reference preserved', () => {
    const k = kv('Psalm 23:1');
    expect(k.status).toBe('exact');
    if (k.status !== 'exact') return;
    expect(refId(k.ref)).toBe('PSA.22.1'); // stored in anchor numbering
    expect(refId(k.original)).toBe('PSA.23.1'); // as the lesson wrote it
    expect(k.sourceScheme).toBe('kjv');
  });
  it('a plain valid verse and a valid range', () => {
    expect(kv('John 3:16').status).toBe('exact');
    expect(kv('1 Corinthians 15:3–4').status).toBe('exact');
  });
  it('an unverified mapping is approximate and NOT exact: the caller must not add it on its own', () => {
    const k = kv('John 6:53');
    expect(k.status).toBe('approximate');
    if (k.status === 'approximate') { expect(k.exact).toBe(false); expect(k.reason).toBeTruthy(); expect(refId(k.original)).toBe('JHN.6.53'); }
  });
  it('a verse past the end of its chapter is invalid: no card, with a reason', () => {
    const k = kv('John 3:37');
    expect(k).toMatchObject({ status: 'invalid' });
    expect(kv('John 99').status).toBe('invalid');
  });
  it('a lesson with no reference gives nothing', () => { expect(keyVerse({ mem: 'Come, Lord Jesus.' }, ctx).status).toBe('none'); expect(keyVerse({}, ctx).status).toBe('none'); });
  it('no lesson of the curriculum has an invalid key verse or scripture reference', async () => {
    const { loadGrades } = await import('../scripts/curriculum/lessonData');
    const bad = loadGrades().flatMap((g) => g.units.flatMap((u) => u.lessons)).flatMap((l) => {
      const k = keyVerse(l, ctx);
      return k.status === 'invalid' ? [`${l.id}: ${k.reason}`] : [];
    });
    expect(bad).toEqual([]);
  });
});
