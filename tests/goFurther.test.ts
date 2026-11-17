import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildGoFurther, keyVerse, keyVerseRef, lessonRefs, refContext, type Known, type LessonLike } from '../src/curriculum/goFurther';
import { loadExtras, loadGrades, loadKnown } from '../scripts/curriculum/lessonData';
import { format, report } from '../scripts/curriculum/lesson-report';
import { refId } from '../src/lib/refs';

const manifest = readFileSync('e2e/lib/routes.mjs', 'utf8');
const patterns = [...new Set([...manifest.matchAll(/route: "([^"]+)"/g)].map((m) => m[1]))];
const toRx = (p: string) => new RegExp('^' + p.replace(/\/:[A-Za-z]+\?/g, '(?:/[^/]+)?').replace(/:[A-Za-z]+/g, '[^/]+') + '$');
const resolvesToRoute = (to: string) => patterns.some((p) => toRx(p).test(to.split(/[?#]/)[0]));

const known = loadKnown();
const extras = loadExtras();
const lessons = loadGrades().flatMap((g) => g.units.flatMap((u) => u.lessons));
const base: LessonLike = { id: 'x-1-1', scripture: 'John 3:16', ccc: '1-3' };

describe('go further links', () => {
  it('reads every lesson of every grade', () => { expect(lessons.length).toBe(456); });

  it('no lesson has a link that does not resolve (ids exist in the data)', () => {
    const bad = lessons.flatMap((l) => buildGoFurther(l, known, extras[l.id]).broken.map((b) => `${l.id}: ${b}`));
    expect(bad).toEqual([]);
  });

  it('every generated link lands on a route the app (and the crawl manifest) has', () => {
    const bad: string[] = [];
    for (const l of lessons) for (const k of buildGoFurther(l, known, extras[l.id]).links) if (!resolvesToRoute(k.to)) bad.push(`${l.id}: ${k.kind} ${k.to}`);
    expect(bad).toEqual([]);
  });

  it('every lesson links its Scripture and its Catechism', () => {
    for (const l of lessons) {
      const kinds = new Set(buildGoFurther(l, known, extras[l.id]).links.map((k) => k.kind));
      expect(kinds.has('scripture'), l.id).toBe(true);
      expect(kinds.has('catechism'), l.id).toBe(true);
    }
  });

  it('a lesson names its own deeper topics, nothing else is added', () => {
    for (const l of lessons.filter((x) => x.deeper?.length)) {
      const r = buildGoFurther(l, known, extras[l.id]).links;
      for (const d of l.deeper ?? []) { const [k, id] = d.split(':'); expect(r.some((x) => x.id === id && x.kind === (k === 'apol' ? 'apologetics' : 'library')), `${l.id} ${d}`).toBe(true); }
    }
  });

  describe('the check itself fails on bad data', () => {
    const k: Known = known;
    it('catechism paragraph out of range', () => { expect(buildGoFurther({ ...base, ccc: '9000' }, k).broken.join()).toMatch(/§9000/); });
    it('unknown apologetics topic and library work', () => {
      const r = buildGoFurther({ ...base, deeper: ['apol:no-such-topic', 'room:no-such-work', 'zzz:1'] }, k);
      expect(r.broken).toHaveLength(3);
      expect(r.links.some((x) => x.kind === 'apologetics' || x.kind === 'library')).toBe(false);
    });
    it('unknown book, chapter past the end, unreadable passage', () => {
      expect(buildGoFurther({ ...base, scripture: 'John 99' }, k).broken.length).toBe(1);
      expect(buildGoFurther({ ...base, scripture: 'Nonsense 1' }, k).broken.length).toBe(1);
    });
    it('unknown track or chain from the extras', () => {
      const r = buildGoFurther(base, k, { tracks: [{ id: 'nope' }], debate: [{ type: 'chain', id: 'nope' }] });
      expect(r.broken).toHaveLength(2);
    });
    it('a route that is not in the manifest is rejected by the route check', () => { expect(resolvesToRoute('/study/not-a-page/1')).toBe(false); });
  });

  it('builds links for a typical lesson', () => {
    const r = buildGoFurther(base, known).links;
    expect(r.find((x) => x.kind === 'scripture')?.to).toBe('/read/webc/JHN/3?v=16');
    expect(r.filter((x) => x.kind === 'catechism').map((x) => x.to)).toEqual(['/study/catechism/1', '/study/catechism/2', '/study/catechism/3']);
  });


  it('requires canonical Vulgate counts before building a reference context', () => {
    expect(refContext((known.editions ?? []).filter((e) => e.id !== 'vulgate'), 'webc')).toBeNull();
    expect(refContext(known.editions, 'missing-edition')).toBeNull();
  });

  it('labels a Scripture link when the chosen Vulgate numbering is only approximate', () => {
    const ctx = refContext(known.editions, 'vulgate');
    expect(ctx).not.toBeNull();
    const lesson = { ...base, scripture: 'Romans 14:1-10' };
    const link = buildGoFurther(lesson, known, undefined, ctx).links.find((x) => x.kind === 'scripture');
    expect(link?.note).toMatch(/English\/KJV numbering.*vulgate location is approximate/i);
    const sameTradition = buildGoFurther(lesson, known).links.find((x) => x.kind === 'scripture');
    expect(sameTradition?.note).toBeUndefined();
  });


  it('discloses that a cross-chapter link opens at the first chapter only', () => {
    const ctx = refContext(known.editions, 'webc');
    const link = buildGoFurther({ ...base, scripture: 'Genesis 1:31–2:3' }, known, undefined, ctx).links.find((x) => x.kind === 'scripture');
    expect(link?.to).toBe('/read/webc/GEN/1?v=31');
    expect(link?.note).toMatch(/opens at chapter 1.*continue through chapter 2/i);
  });

  it('reads several passages', () => { expect(lessonRefs('Luke 5:17-26; Matthew 9:1-8').map((x) => x.ref.book)).toEqual(['LUK', 'MAT']); });
});

describe('key verse for review', () => {
  const ctx = refContext(known.editions, 'vulgate');
  it('reads the reference after the quotation', () => {
    const k = keyVerseRef({ mem: '“Take heart, my son; your sins are forgiven.” (Matthew 9:2)' }, ctx);
    expect(k && refId(k.ref)).toBe('MAT.9.2');
  });
  it('reads a range', () => { expect(refId(keyVerseRef({ mem: '“…he was raised on the third day.” (1 Corinthians 15:3–4)' }, ctx)!.ref)).toBe('1CO.15.3-4'); });
  it('gives nothing when there is no reference (a prayer), rather than inventing one', () => {
    expect(keyVerseRef({ mem: 'Come, Lord Jesus.' })).toBeNull();
    expect(keyVerseRef({})).toBeNull();
  });

  it('withholds an unverified key verse from automatic memorization', () => {
    const k = keyVerse({ mem: '“Whoever eats my flesh...” (John 6:51–58)' }, ctx);
    expect(k.status).toBe('approximate');
    expect(keyVerseRef({ mem: '“Whoever eats my flesh...” (John 6:51–58)' }, ctx)).toBeNull();
  });


  it('does not call a static-only mapping exact when edition counts are unavailable', () => {
    const k = keyVerse({ mem: '“Take heart, my son; your sins are forgiven.” (Matthew 9:2)' });
    expect(k.status).toBe('approximate');
    expect(keyVerseRef({ mem: '“Take heart, my son; your sins are forgiven.” (Matthew 9:2)' })).toBeNull();
  });

  it('most lessons have a verse the memorize list can hold', () => {
    const n = lessons.filter((l) => keyVerseRef(l, ctx)).length;
    expect(n).toBeGreaterThan(300);
  });
});

describe('lesson report script', () => {
  const rows = report();
  it('has a row per grade and counts every lesson', () => {
    expect(rows.map((r) => r.grade)).toEqual(loadGrades().map((g) => g.id));
    expect(rows.reduce((a, r) => a + r.lessons, 0)).toBe(456);
  });
  it('finds no broken links in the shipped data', () => { expect(rows.flatMap((r) => r.broken)).toEqual([]); });
  it('prints a table with a total line', () => { expect(format(rows)).toMatch(/\nALL\s+456\s/); });
});
