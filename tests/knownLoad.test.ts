import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { buildGoFurther, type Known } from '../src/curriculum/goFurther';
import { ALL_SOURCES, assembleKnown, loadKnownFrom, memoizeComplete, verifyWorks, type Loaders, type SourceName } from '../src/curriculum/knownLoad';
import { cccList, cccListSafe, cccParse } from '../src/curriculum/cccList';
import { loadGrades, loadKnown } from '../scripts/curriculum/lessonData';

const data: Record<SourceName, unknown> = {
  apologetics: { topics: [{ id: 'real-presence', title: 'The Real Presence' }] },
  library: { works: [{ id: 'w-ok', title: 'A readable work' }, { id: 'w-gone', title: 'A work with no file' }] },
  catechism: { paragraphs: 2865 },
  tracks: [{ id: 'trk', title: 'A track', levels: [{ steps: [{ kind: 'inapp', type: 'lesson', id: 'x-1-1' }] }] }],
  chains: { chain: [{ id: 'c1', title: 'A chain', to: '/study/arguments/c1' }] },
  editions: [],
};
const loaders = (over: Partial<Record<SourceName, () => Promise<unknown>>> = {}): Loaders =>
  Object.fromEntries(ALL_SOURCES.map((n) => [n, over[n] ?? (() => Promise.resolve(data[n]))])) as Loaders;
const lesson = { id: 'x-1-1', scripture: 'John 3:16', ccc: '1-3', deeper: ['apol:real-presence', 'room:w-ok'] };

describe('loading what Go further knows about', () => {
  it('complete when every source loads', async () => {
    const r = await loadKnownFrom(loaders());
    expect(r.status).toBe('complete');
    expect(r.failed).toEqual([]);
    const f = buildGoFurther(lesson, r.known, { tracks: [{ id: 'trk' }] });
    expect(f.broken).toEqual([]);
    expect(f.links.map((l) => l.kind)).toEqual(expect.arrayContaining(['apologetics', 'library', 'track']));
  });

  it('a failed source makes the result partial and names it', async () => {
    const r = await loadKnownFrom(loaders({ tracks: () => Promise.reject(new Error('network')) }));
    expect(r.status).toBe('partial');
    expect(r.failed).toEqual(['tracks']);
  });
  it('a source that answers "nothing" (a missing file) is a failure, not an empty list', async () => {
    const r = await loadKnownFrom(loaders({ apologetics: () => Promise.resolve(null) }));
    expect(r.status).toBe('partial');
    expect(r.failed).toEqual(['apologetics']);
  });
  it('everything failing is "failed"', async () => {
    const r = await loadKnownFrom(loaders(Object.fromEntries(ALL_SOURCES.map((n) => [n, () => Promise.reject(new Error('offline'))]))));
    expect(r.status).toBe('failed');
  });


  it('withholds Scripture links rather than guessing when edition counts fail to load', async () => {
    const r = await loadKnownFrom(loaders({ editions: () => Promise.reject(new Error('offline')) }));
    const result = buildGoFurther(lesson, r.known);
    expect(result.links.some((link) => link.kind === 'scripture')).toBe(false);
    expect(result.unavailable).toContainEqual(expect.objectContaining({ label: 'John 3:16', reason: expect.stringMatching(/reference counts/i) }));
  });

  it('what depends on a failed source is reported as unavailable, never as broken or silently dropped', async () => {
    const r = await loadKnownFrom(loaders({ apologetics: () => Promise.reject(new Error('x')), library: () => Promise.reject(new Error('x')), tracks: () => Promise.reject(new Error('x')), chains: () => Promise.reject(new Error('x')) }));
    const f = buildGoFurther(lesson, r.known, { tracks: [{ id: 'trk' }], debate: [{ type: 'chain', id: 'c1' }] });
    expect(f.broken).toEqual([]);
    expect(f.unavailable.map((u) => u.label)).toEqual(expect.arrayContaining(['apol:real-presence', 'room:w-ok', 'track trk', 'chain:c1']));
    expect(f.links.some((l) => l.kind === 'catechism')).toBe(true); // what is still known is still shown
  });
  it('while the Catechism index is down, paragraph numbers are not rejected against an unknown limit', async () => {
    const r = await loadKnownFrom(loaders({ catechism: () => Promise.reject(new Error('x')) }));
    expect(buildGoFurther({ ...lesson, ccc: '2000' }, r.known).broken).toEqual([]);
  });

  describe('retry and caching', () => {
    it('does not keep a partial result: the next call tries again, and a complete one is then kept', async () => {
      let tracks = 0;
      const calls = vi.fn();
      const load = memoizeComplete(() => loadKnownFrom(loaders({ tracks: () => { calls(); return ++tracks === 1 ? Promise.reject(new Error('blip')) : Promise.resolve(data.tracks); } })));
      expect((await load()).status).toBe('partial');
      const second = await load();
      expect(second.status).toBe('complete');
      expect(second.known.tracks.get('trk')).toBe('A track');
      await load();
      expect(calls).toHaveBeenCalledTimes(2); // not a third time: the complete result is kept
    });
    it('keeps retrying while it keeps failing', async () => {
      const calls = vi.fn();
      const load = memoizeComplete(() => loadKnownFrom(loaders({ library: () => { calls(); return Promise.reject(new Error('down')); } })));
      await load(); await load(); await load();
      expect(calls).toHaveBeenCalledTimes(3);
    });
    it('concurrent callers share one load', async () => {
      const calls = vi.fn();
      const load = memoizeComplete(() => loadKnownFrom(loaders({ catechism: () => { calls(); return Promise.resolve(data.catechism); } })));
      await Promise.all([load(), load(), load()]);
      expect(calls).toHaveBeenCalledTimes(1);
    });
  });

  describe('library works are offered only when their file can be read', () => {
    const base = assembleKnown({ library: data.library as never, apologetics: data.apologetics as never }, new Set());
    it('a work whose file is missing is removed, so the lesson reports it', async () => {
      const k = await verifyWorks(base, ['w-ok', 'w-gone'], async (id) => id === 'w-ok');
      expect(k.works.has('w-ok')).toBe(true);
      expect(k.works.has('w-gone')).toBe(false);
      expect(buildGoFurther({ ...lesson, deeper: ['room:w-gone'] }, k).broken.join()).toMatch(/no such library work/);
    });
    it('a temporary failure to check marks the library failed (retryable) and is not reported as a missing work', async () => {
      const k = await verifyWorks(base, ['w-ok'], async () => { throw new Error('offline'); });
      expect(k.failed?.has('library')).toBe(true);
      const f = buildGoFurther({ ...lesson, deeper: ['room:w-ok'] }, k);
      expect(f.broken).toEqual([]);
      expect(f.unavailable.some((x) => x.label === 'room:w-ok')).toBe(true);
      expect(f.unavailable.some((x) => x.label === 'John 3:16')).toBe(true);
    });
    it('the report script and the app use one rule: only works with a data file', () => {
      const k: Known = loadKnown();
      const index = JSON.parse(readFileSync('public/data/library/index.json', 'utf8')).works as { id: string }[];
      const have = new Set(readdirSync('public/data/library/works').map((f) => f.replace(/\.json$/, '')));
      expect([...k.works.keys()].sort()).toEqual(index.map((w) => w.id).filter((id) => have.has(id)).sort());
      for (const id of k.works.keys()) expect(existsSync(`public/data/library/works/${id}.json`), id).toBe(true);
    });
    it('every library work a lesson names has a readable file', () => {
      const k = loadKnown();
      const missing = loadGrades().flatMap((g) => g.units.flatMap((u) => u.lessons)).flatMap((l) => (l.deeper ?? []).filter((d) => d.startsWith('room:') && !k.works.has(d.slice(5))).map((d) => `${l.id} ${d}`));
      expect(missing).toEqual([]);
    });
  });
});

describe('Catechism lists are strict', () => {
  it('reads singles, ranges and lists, with an en dash too', () => {
    expect(cccList('27-30,355')).toEqual([27, 28, 29, 30, 355]);
    expect(cccList('5')).toEqual([5]);
    expect(cccList('10–12')).toEqual([10, 11, 12]);
  });
  it('rejects a malformed segment instead of skipping it', () => {
    for (const bad of ['27-30,abc', '12,,14', '5-2', '0', '1-', 'x', '', '1.5', '12 13', '-4']) {
      expect(() => cccList(bad), bad).toThrow(/Malformed Catechism list/);
      expect(cccParse(bad).errors.length, bad).toBeGreaterThan(0);
    }
  });
  it('keeps the numbers it could read alongside the errors, for reporting', () => {
    const r = cccParse('10,zz,12');
    expect(r.numbers).toEqual([10, 12]);
    expect(r.errors).toHaveLength(1);
  });
  it('the display helper never throws', () => { expect(cccListSafe('10,zz,12')).toEqual([10, 12]); expect(cccListSafe('')).toEqual([]); });
  it('a lesson with a malformed list is reported broken', () => {
    const k = loadKnown();
    const f = buildGoFurther({ id: 'x', scripture: 'John 3:16', ccc: '27-30,abc' }, k);
    expect(f.broken.join()).toMatch(/"abc" is not a paragraph number/);
    expect(buildGoFurther({ id: 'x', scripture: 'John 3:16', ccc: '' }, k).broken.length).toBeGreaterThan(0);
  });
  it('every shipped lesson has a well-formed list', () => {
    const bad = loadGrades().flatMap((g) => g.units.flatMap((u) => u.lessons)).filter((l) => cccParse(l.ccc).errors.length).map((l) => `${l.id}: ${l.ccc}`);
    expect(bad).toEqual([]);
  });
});
