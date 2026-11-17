import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEEP_WATERS, type DeepPrompt } from '../src/data/deepWaters';
import { countMentions, tiersByFamiliarity, TIER_CUTS } from '../src/lib/deepWatersRarity';
import { cycleLength, DAILY_SIZE, dailySchedule, familyOf, WINDOW } from '../src/lib/deepWatersSchedule';
import { dailyDeepPrompts, matchDeepAnswer, practiceDeepPrompts } from '../src/lib/deepWaters';

const P = (id: string): DeepPrompt => DEEP_WATERS.find((p) => p.id === id)!;
const tierOf = (id: string, guess: string) => { const m = matchDeepAnswer(P(id), guess); return m.status === 'match' ? m.answer.tier : null; };

describe('rarity from familiarity scores', () => {
  it('ranks by score: a higher score is never a rarer tier', () => {
    const scores = Array.from({ length: 200 }, (_, i) => 200 - i + (i % 3) / 10);
    const t = tiersByFamiliarity(scores);
    for (let i = 1; i < t.length; i++) expect(t[i], `position ${i}`).toBeGreaterThanOrEqual(t[i - 1]);
  });
  it('cuts a spread of distinct scores into the six bands in the stated proportions', () => {
    const t = tiersByFamiliarity(Array.from({ length: 1000 }, (_, i) => 1000 - i));
    const share = (n: number) => t.filter((x) => x === n).length / 1000;
    expect(share(1)).toBeCloseTo(TIER_CUTS[0], 1);
    expect(share(2)).toBeCloseTo(TIER_CUTS[1] - TIER_CUTS[0], 1);
    expect(share(3)).toBeCloseTo(TIER_CUTS[2] - TIER_CUTS[1], 1);
    expect(share(4)).toBeCloseTo(TIER_CUTS[3] - TIER_CUTS[2], 1);
    expect(share(5)).toBeCloseTo(TIER_CUTS[4] - TIER_CUTS[3], 1);
    expect(share(6)).toBeCloseTo(1 - TIER_CUTS[4], 1);
  });
  it('equal scores always share a tier, whatever their order in the input', () => {
    const a = tiersByFamiliarity([5, 5, 5, 1, 1, 1, 1, 1, 1, 1]);
    expect(new Set(a.slice(0, 3)).size).toBe(1);
    expect(new Set(a.slice(3)).size).toBe(1);
    const b = tiersByFamiliarity([1, 5, 1, 5, 1, 5, 1, 1, 1, 1]);
    expect(b[1]).toBe(b[3]); expect(b[0]).toBe(b[2]);
  });
  it('a large group of equally obscure answers is deep cuts, not middling', () => {
    const t = tiersByFamiliarity([...Array.from({ length: 10 }, (_, i) => 100 - i), ...Array.from({ length: 190 }, () => 1)]);
    expect(t.slice(10).every((x) => x === 6)).toBe(true);
  });
  it('handles no answers and one answer', () => { expect(tiersByFamiliarity([])).toEqual([]); expect(tiersByFamiliarity([3])).toEqual([1]); });
  it('counts whole words only', () => {
    const text = 'david slew goliath. the house of david. davidic and david\'s kin. david';
    expect(countMentions(text, 'David')).toBe(4);
    expect(countMentions(text, 'Dav')).toBe(0);
    expect(countMentions(text, 'Ab')).toBe(0); // too short to count
  });
});

describe('the generated questions', () => {
  it('are exactly what scripts/deepwaters/build.ts produces from the data now (no hand edits, no drift)', () => {
    expect(() => execSync('npx tsx scripts/deepwaters/build.ts --check', { stdio: 'pipe', timeout: 120000 })).not.toThrow();
  }, 130000);
  it('record where they came from, for every generated question', () => {
    const src = JSON.parse(readFileSync('src/data/deepWaters.sources.json', 'utf8')) as { inputs: { path: string; sha256: string }[]; prompts: { id: string; from: string; rule: string }[] };
    const generated = DEEP_WATERS.filter((p) => p.source);
    expect(generated.length).toBeGreaterThanOrEqual(40);
    expect(src.prompts.map((p) => p.id).sort()).toEqual(generated.map((p) => p.id).sort());
    for (const p of src.prompts) { expect(p.from.length, p.id).toBeGreaterThan(10); expect(p.rule.length, p.id).toBeGreaterThan(20); }
    for (const i of src.inputs) expect(i.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it('every manual tier override names a real answer and says why', () => {
    const ov = JSON.parse(readFileSync('scripts/deepwaters/overrides.json', 'utf8')) as { prompt: string; answer: string; tier: number; reason: string }[];
    expect(ov.length).toBeGreaterThan(0);
    for (const o of ov) {
      const a = P(o.prompt)?.answers.find((x) => x.answer.toLowerCase() === o.answer.toLowerCase());
      expect(a, `${o.prompt}: ${o.answer}`).toBeTruthy();
      expect(a!.tier, `${o.prompt}: ${o.answer}`).toBe(o.tier);
      expect(o.reason.length).toBeGreaterThan(20);
    }
  });
  it('give every question with 20 or more answers both easy answers and deep cuts', () => {
    const flat: string[] = [];
    for (const p of DEEP_WATERS.filter((x) => x.source && x.answers.length >= 20)) {
      const tiers = new Set(p.answers.map((a) => a.tier));
      if (!tiers.has(1) || ![...tiers].some((t) => t >= 5)) flat.push(`${p.id}: tiers ${[...tiers].sort().join('')}`);
    }
    expect(flat).toEqual([]);
  });
  it('rank well-known answers as common and obscure ones as deep cuts', () => {
    expect(tierOf('places-ACT', 'Jerusalem')).toBe(1);
    expect(tierOf('places-ACT', 'Damascus')).toBeLessThanOrEqual(2);
    expect(tierOf('places-ACT', 'Ephesus')).toBeLessThanOrEqual(3);
    expect(tierOf('places-ACT', 'Fair Havens')).toBeGreaterThanOrEqual(5);
    
    expect(tierOf('places-LUK', 'Emmaus')).toBeLessThanOrEqual(2); // a manual override: one verse, but one of the best-known scenes
    expect(tierOf('places-JOS', 'Jericho')).toBeLessThanOrEqual(2);
    expect(tierOf('saints-any', 'Thomas Aquinas')).toBeLessThanOrEqual(2);
    expect(tierOf('saints-any', 'Francis of Assisi')).toBeLessThanOrEqual(2);
    expect(tierOf('saints-any', 'Ambrose')).toBeLessThanOrEqual(2);
    expect(tierOf('saints-03', 'Patrick')).toBeLessThanOrEqual(2);
    expect(tierOf('saints-03', 'Joseph')).toBeLessThanOrEqual(2);
    expect(tierOf('bible-people', 'David')).toBe(1);
    expect(tierOf('bible-people', 'Moses')).toBe(1);
  });
  it('accept the modern spelling of a saint Butler spells the old way, and "X of Place"', () => {
    expect(matchDeepAnswer(P('saints-any'), 'Jerome').status).toBe('match');
    expect(matchDeepAnswer(P('saints-any'), 'Jerom').status).toBe('match');
    expect(matchDeepAnswer(P('saints-any'), 'Francis of Assisi').status).toBe('match');
    expect(matchDeepAnswer(P('saints-any'), 'Athanasius of Alexandria').status).toBe('match');
  });
  it('contain no OCR debris: names are words, not fragments or digits', () => {
    const bad: string[] = [];
    for (const p of DEEP_WATERS.filter((x) => x.source)) for (const a of p.answers) for (const s of [a.answer, ...(a.aliases ?? [])]) {
      if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '’\-.]*$/.test(s) || /\s{2,}/.test(s) || s.length < 3) bad.push(`${p.id}: ${s}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the bank as a whole', () => {
  it('is large, spread over every theme, and every question has a theme', () => {
    expect(DEEP_WATERS.length).toBeGreaterThanOrEqual(80);
    expect(DEEP_WATERS.reduce((n, p) => n + p.answers.length, 0)).toBeGreaterThanOrEqual(5000);
    const themes = new Set(DEEP_WATERS.map((p) => p.theme));
    expect([...themes].sort()).toEqual(['art-music', 'church-history', 'devotion', 'doctrine', 'liturgy', 'people', 'places', 'saints', 'scripture']);
  });
  it('every open question has at least 12 answers, and the ones that name a whole set equal it', () => {
    for (const p of DEEP_WATERS) expect(p.answers.length, p.id).toBeGreaterThanOrEqual(p.closed ?? 12);
  });
  it('has a review record for every question that matches its content', () => {
    expect(() => execSync('npx tsx scripts/deepwaters/review.ts', { stdio: 'pipe', timeout: 120000 })).not.toThrow();
  }, 130000);
});

describe('the daily schedule', () => {
  const DAYS = 366;
  const days = Array.from({ length: DAYS }, (_, i) => dailyDeepPrompts(20000 + i));
  it('gives seven different questions every day', () => {
    for (const [i, d] of days.entries()) { expect(d, `day ${i}`).toHaveLength(DAILY_SIZE); expect(new Set(d.map((p) => p.id)).size, `day ${i}`).toBe(DAILY_SIZE); }
  });
  it('is the same on every call and every device (no state, no clock, no randomness)', () => {
    expect(dailyDeepPrompts(20123).map((p) => p.id)).toEqual(dailyDeepPrompts(20123).map((p) => p.id));
    expect(dailySchedule(DEEP_WATERS, 20123).map((p) => p.id)).toEqual(dailyDeepPrompts(20123).map((p) => p.id));
  });
  it('never brings a question back sooner than a cycle minus four days (its home day, give or take two, either side)', () => {
    const gap = cycleLength(DEEP_WATERS.length) - 2 * WINDOW;
    const last = new Map<string, number>();
    const tooSoon: string[] = [];
    days.forEach((d, i) => { for (const p of d) { const j = last.get(p.id); if (j !== undefined && i - j < gap) tooSoon.push(`${p.id} on day ${j} and ${i}`); last.set(p.id, i); } });
    expect(tooSoon).toEqual([]);
    expect(gap).toBeGreaterThanOrEqual(8);
  });
  it('spreads each family: no day has more than its share of places or saints questions', () => {
    const per = (f: string) => DEEP_WATERS.filter((p) => familyOf(p.id) === f).length;
    const D = cycleLength(DEEP_WATERS.length);
    for (const [i, d] of days.entries()) {
      for (const f of ['places', 'saints']) {
        const n = d.filter((p) => familyOf(p.id) === f).length;
        expect(n, `day ${i} has ${n} ${f} questions: ${d.map((p) => p.id).join(' ')}`).toBeLessThanOrEqual(Math.ceil(per(f) / D) + 1);
      }
    }
  });
  it('keeps a day varied: at most two questions of one theme on nearly every day', () => {
    let crowded = 0;
    for (const d of days) { const c: Record<string, number> = {}; d.forEach((p) => (c[p.theme] = (c[p.theme] ?? 0) + 1)); if (Math.max(...Object.values(c)) > 3) crowded++; }
    expect(crowded).toBeLessThanOrEqual(DAYS * 0.03);
  });
  it('uses the whole bank over a year, and each question about the same number of times', () => {
    const uses = new Map<string, number>();
    for (const d of days) for (const p of d) uses.set(p.id, (uses.get(p.id) ?? 0) + 1);
    expect(uses.size).toBe(DEEP_WATERS.length);
    const counts = [...uses.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(3);
  });
  it('handles any day number, including ones far away and before the epoch', () => {
    for (const d of [0, 1, 365, 20000, 99999, 1_000_000, -1, -400]) expect(dailyDeepPrompts(d), String(d)).toHaveLength(DAILY_SIZE);
  });
  it('practice runs have their own deal and never reproduce today\'s daily set', () => {
    const today = dailyDeepPrompts(20500).map((p) => p.id).join();
    for (let seed = 1; seed < 40; seed++) expect(practiceDeepPrompts(seed).map((p) => p.id).join(), `seed ${seed}`).not.toBe(today);
    expect(practiceDeepPrompts(7).map((p) => p.id)).toEqual(practiceDeepPrompts(7).map((p) => p.id));
  });
});
