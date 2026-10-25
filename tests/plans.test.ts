import { beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { builtinPlans, type PlanDef } from '../src/plans/builtin';
import { parseRefId } from '../src/lib/refs';
import { BOOKS } from '../src/lib/canon';

let plans: PlanDef[] = [];
let counts: Record<string, number[]> = {};

beforeAll(async () => {
  // serve the app's data files from disk, as the browser would from the network
  vi.stubGlobal('fetch', async (url: string) => {
    const path = `public${String(url).replace(/^\/?/, '/')}`;
    if (!existsSync(path)) return new Response('', { status: 404 });
    return new Response(readFileSync(path), { status: 200 });
  });
  const ed = JSON.parse(readFileSync('public/data/editions.json', 'utf8')).editions.find((e: any) => e.id === 'vulgate');
  counts = ed.verseCounts;
  plans = await builtinPlans(ed);
});

const chaptersIn = (days: PlanDef['days']) => {
  const seen = new Map<string, number>();
  for (const d of days) for (const r of d.refs) {
    const x = parseRefId(r);
    if (!x) continue;
    for (let c = x.c1; c <= x.c2; c++) seen.set(`${x.book}.${c}`, (seen.get(`${x.book}.${c}`) ?? 0) + 1);
  }
  return seen;
};

describe('reading plan diagnostics', () => {
  it('has the plans we advertise', () => {
    for (const id of ['bible-365', 'nt-90', 'gospels-30', 'john-21', 'psalter-30', 'biay']) expect(plans.find((p) => p.id === id), id).toBeTruthy();
  });

  it('every passage in every plan is a real reference inside its book', () => {
    const bad: string[] = [];
    for (const p of plans) for (const [i, d] of p.days.entries()) for (const r of d.refs) {
      const x = parseRefId(r);
      if (!x) { bad.push(`${p.id} day ${i + 1}: ${r} does not parse`); continue; }
      const n = counts[x.book]?.length;
      if (n && (x.c1 < 1 || x.c2 > n)) bad.push(`${p.id} day ${i + 1}: ${r} is outside ${x.book} (${n} chapters)`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('the whole-Bible plan reads every chapter of every book exactly once, in order', () => {
    const p = plans.find((x) => x.id === 'bible-365')!;
    expect(p.days).toHaveLength(365);
    const seen = chaptersIn(p.days);
    const missing: string[] = [], twice: string[] = [];
    for (const b of BOOKS) for (let c = 1; c <= (counts[b.id]?.length ?? 0); c++) { const n = seen.get(`${b.id}.${c}`) ?? 0; if (n === 0) missing.push(`${b.id} ${c}`); if (n > 1) twice.push(`${b.id} ${c}`); }
    expect(missing.slice(0, 5)).toEqual([]);
    expect(twice.slice(0, 5)).toEqual([]);
    expect(p.days.every((d) => d.refs.length > 0)).toBe(true);
  });

  it('the New Testament and Gospel plans cover exactly their books', () => {
    for (const [id, books, days] of [['nt-90', BOOKS.filter((b) => b.testament === 'NT').map((b) => b.id), 90], ['gospels-30', ['MAT', 'MRK', 'LUK', 'JHN'], 30], ['john-21', ['JHN'], 21]] as const) {
      const p = plans.find((x) => x.id === id)!;
      expect(p.days, id).toHaveLength(days);
      const seen = chaptersIn(p.days);
      const want = books.flatMap((b) => Array.from({ length: counts[b].length }, (_, i) => `${b}.${i + 1}`));
      expect([...seen.keys()].sort(), id).toEqual(want.sort());
    }
  });

  it('the psalter plan covers all 150 psalms', () => {
    const seen = chaptersIn(plans.find((x) => x.id === 'psalter-30')!.days);
    expect(seen.size).toBe(150);
  });

  it('Bible in a Year lists its 365 days and flags the day without a passage', () => {
    const p = plans.find((x) => x.id === 'biay')!;
    expect(p.days).toHaveLength(365);
    const empty = p.days.filter((d) => d.refs.length === 0);
    expect(empty.every((d) => !!d.note)).toBe(true);
    expect(empty.length).toBeLessThanOrEqual(1);
  });
});
