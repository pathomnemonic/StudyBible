import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { BANK_SIZE, DEEP_WATERS } from '../src/data/deepWaters';
import { TABLE_NAMES, buildPools } from '../src/data/deepWatersPools';
import { matchDeepAnswer } from '../src/lib/deepWaters';
import { cycleLength, familyOf } from '../src/lib/deepWatersSchedule';

const derived = DEEP_WATERS.filter((p) => p.derived);
const pools = new Map(buildPools(DEEP_WATERS.filter((p) => !p.derived)).map((p) => [p.id, p]));

// an independent reading of the letters of a name, written separately from the generator
const clean = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^the /, '');
const NUMERALS = new Set(['popes-since-1500', 'councils', 'saint-popes']);
const L = (s: string, strip = false) => (strip ? clean(s).replace(/\s+[ivxl]+$/, '') : clean(s)).replace(/[^a-z]/g, '');
const V = (c: string) => 'aeiou'.includes(c);

/** what a question's own text says its answers must satisfy */
function ruleOf(text: string, strip: boolean): ((name: string) => boolean) | null {
  const L2 = (x: string) => L(x, strip);
  let m: RegExpMatchArray | null;
  if ((m = text.match(/with the letter ([A-Z]) twice in/))) return (s) => (L2(s).split(m![1].toLowerCase()).length - 1) >= 2;
  if ((m = text.match(/with the letter ([A-Z]) in /))) return (s) => L2(s).includes(m![1].toLowerCase());
  if ((m = text.match(/starts with ([A-Z]) and ends with ([A-Z])\.$/))) return (s) => { const l = L2(s); return l.length > 1 && l[0] === m![1].toLowerCase() && l.endsWith(m![2].toLowerCase()); };
  if ((m = text.match(/starts with ([A-Z]) and has ([A-Z]) in it\.$/))) return (s) => { const l = L2(s); return l[0] === m![1].toLowerCase() && l.slice(1).includes(m![2].toLowerCase()); };
  if ((m = text.match(/starts with a letter from ([A-Z]) to ([A-Z])\.$/))) return (s) => { const c = L2(s)[0] ?? ''; return c >= m![1].toLowerCase() && c <= m![2].toLowerCase(); };
  if ((m = text.match(/starts with ([A-Z])\.$/))) return (s) => L2(s)[0] === m![1].toLowerCase();
  if ((m = text.match(/ends with ([A-Z])\.$/))) return (s) => L2(s).endsWith(m![1].toLowerCase());
  if ((m = text.match(/with both ([A-Z]) and ([A-Z]) in /))) return (s) => L2(s).includes(m![1].toLowerCase()) && L2(s).includes(m![2].toLowerCase());
  if ((m = text.match(/with ([A-Z]) but no ([A-Z]) in /))) return (s) => L2(s).includes(m![1].toLowerCase()) && !L2(s).includes(m![2].toLowerCase());
  if ((m = text.match(/with no ([A-Z]) in /))) return (s) => !L2(s).includes(m![1].toLowerCase());
  if ((m = text.match(/has ([A-Z]) as its second letter/))) return (s) => L2(s)[1] === m![1].toLowerCase();
  if ((m = text.match(/with exactly (\d+) letters in /))) return (s) => L2(s).length === +m![1];
  if ((m = text.match(/with (\d+) or more letters in /))) return (s) => L2(s).length >= +m![1];
  if ((m = text.match(/with (\d+) letters or fewer in /))) return (s) => L2(s).length <= +m![1];
  if ((m = text.match(/with exactly (\d+) vowels? in /))) return (s) => [...L2(s)].filter(V).length === +m![1];
  if (/with a double letter in /.test(text)) return (s) => /(.)\1/.test(L2(s));
  if (/starts and ends with the same letter/.test(text)) return (s) => { const l = L2(s); return l.length > 1 && l[0] === l[l.length - 1]; };
  if (/starts with a vowel/.test(text)) return (s) => V(L2(s)[0] ?? '');
  if (/ends with a vowel/.test(text)) return (s) => V(L2(s).slice(-1));
  if (/starts with a consonant/.test(text)) return (s) => { const c = L2(s)[0] ?? ''; return !!c && !V(c); };
  if (/with a number in /.test(text)) return (s) => /\d/.test(s);
  if ((m = text.match(/with the word “(\w+)” in /))) return (s) => { const w = clean(s).split(/[^a-z0-9']+/).filter(Boolean); return m![1] === 'the' ? w.slice(1).includes('the') : w.includes(m![1]); };
  if ((m = text.match(/with a (\d)-word name\.$/))) return (s) => clean(s).split(/[^a-z0-9']+/).filter(Boolean).length === +m![1];
  if ((m = text.match(/that is (one|two|three|four|five) words? long\.$/))) return (s) => clean(s).split(/[^a-z0-9']+/).filter(Boolean).length === ['', 'one', 'two', 'three', 'four', 'five'].indexOf(m![1]);
  return null;
}

describe('the questions derived by rule', () => {
  it('are the ones the rules choose now (the stored choice in deepWaters.derived.json is not out of date)', () => {
    expect(() => execSync('npx tsx scripts/deepwaters/derive.ts', { stdio: 'pipe', timeout: 120000 })).not.toThrow();
  }, 130000);
  it('fill the bank to a whole number of days, 370 days of seven', () => {
    expect(DEEP_WATERS).toHaveLength(BANK_SIZE);
    expect(BANK_SIZE).toBe(2590);
    expect(cycleLength(DEEP_WATERS.length)).toBe(370);
    expect(derived.length).toBeGreaterThan(2300);
  });
  it('are all different: no two share a wording, an id or an identical set of answers', () => {
    expect(new Set(DEEP_WATERS.map((p) => p.id)).size).toBe(DEEP_WATERS.length);
    expect(new Set(DEEP_WATERS.map((p) => p.prompt)).size).toBe(DEEP_WATERS.length);
    const sets = new Map<string, string>();
    const same: string[] = [];
    for (const p of DEEP_WATERS) { const k = p.answers.map((a) => a.answer).sort().join('|'); const o = sets.get(k); if (o) same.push(`${p.id} = ${o}`); sets.set(k, p.id); }
    expect(same).toEqual([]);
  });
  it('are short, plain and easy: one sentence, some answers nearly everyone would name, and enough answers to be fun', () => {
    for (const p of derived) {
      expect(p.prompt.split(/\s+/).length, p.id).toBeLessThanOrEqual(26);
      expect(`${p.prompt} ${p.context}`, p.id).not.toMatch(/\b(above|below)\b/i);
      expect(p.prompt, p.id).toMatch(/^Name (a|an|one of) .+\.$/);
      const easy = p.answers.filter((a) => a.tier <= 2).length;
      expect(p.answers.some((a) => a.tier <= 3), p.id).toBe(true);
      if (!['era', 'where', 'set', 'section', 'group', 'trade', 'mother', 'named', 'freq', 'decade', 'table'].includes(p.derived!.kind)) expect(easy, p.id).toBeGreaterThanOrEqual(p.closed ? 2 : 3);
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(p.derived!.kind === 'freq' ? 4 : p.closed || ['table', 'era', 'group', 'section', 'where', 'named', 'set', 'decade'].includes(p.derived!.kind) ? 12 : 60);
      if (p.answers.length >= 40 && !['table', 'era', 'group', 'section', 'where', 'named', 'set', 'decade', 'freq'].includes(p.derived!.kind)) expect(new Set(p.answers.map((a) => a.tier)).size, p.id).toBeGreaterThanOrEqual(5);
      if (p.closed) expect(p.closed, p.id).toBe(p.answers.length);
    }
  });
  it('give each question every answer on its list that obeys the rule in its own wording, and no other (checked by a separate implementation)', () => {
    let checked = 0;
    for (const p of derived) {
      const pool = pools.get(p.derived!.pool);
      expect(pool, p.id).toBeDefined();
      const rule = ruleOf(p.prompt, NUMERALS.has(p.derived!.pool));
      const inPool = new Set(pool!.answers.map((a) => a.answer));
      for (const a of p.answers) expect(inPool.has(a.answer), `${p.id}: ${a.answer} is not on the list`).toBe(true);
      if (!rule) continue; // the questions about facts are checked below
      const want = pool!.answers.filter((a) => rule(a.answer)).map((a) => a.answer).sort();
      expect(p.answers.map((a) => a.answer).sort(), p.id).toEqual(want);
      checked++;
    }
    expect(checked).toBeGreaterThan(2200);
  });
  it('mark a question closed only when its whole list is the real-world set', () => {
    const closedPools = [...new Set(derived.filter((p) => p.closed).map((p) => p.derived!.pool))].sort();
    expect(closedPools).toEqual(['act-of-contrition', 'angel-of-god', 'anima-christi', 'apostles-creed', 'beatitudes', 'bible-books', 'councils', 'doctors', 'glory-be', 'hail-holy-queen', 'hail-mary', 'magnificat', 'memorare', 'mysteries', 'our-father', 'popes-since-1500', 'psalm-23', 'rites', 'st-michael', 'ten-commandments'].sort());
  });
  it('are accepted when a player types any of their answers, in any case', () => {
    const sample = derived.filter((_, i) => i % 37 === 0);
    for (const p of sample) for (const a of p.answers.slice(0, 6)) {
      const st = matchDeepAnswer(p, a.answer.toUpperCase());
      expect(['match', 'ambiguous'], `${p.id}: ${a.answer}`).toContain(st.status);
    }
  });
  it('spread over the nine themes, none holding more than a quarter of the bank', () => {
    const by: Record<string, number> = {};
    for (const p of DEEP_WATERS) by[p.theme] = (by[p.theme] ?? 0) + 1;
    expect(Object.keys(by).sort()).toEqual(['art-music', 'church-history', 'devotion', 'doctrine', 'liturgy', 'people', 'places', 'saints', 'scripture']);
    for (const [t, n] of Object.entries(by)) expect(n / DEEP_WATERS.length, t).toBeLessThanOrEqual(0.25);
  });
  it('keep each list to one family, so a day never holds two questions about the same list', () => {
    expect(familyOf('d.saints.has.a')).toBe('d.saints');
    expect(familyOf('d.calendar-saints.has.a')).toBe('d.calendar-saints');
    expect(familyOf('saints-03')).toBe('saints');
  });
});

describe('the closed lists of words', () => {
  it('the Our Father is exactly its words (the game cannot accept "the", "of", "our", "and" or "a"), written out by hand', () => {
    const expected = ['father', 'who', 'art', 'in', 'heaven', 'hallowed', 'be', 'thy', 'name', 'kingdom', 'come', 'will', 'done', 'on', 'earth', 'as', 'it', 'is', 'give', 'us', 'this', 'day', 'daily', 'bread', 'forgive', 'trespasses', 'we', 'those', 'trespass', 'against', 'lead', 'not', 'into', 'temptation', 'but', 'deliver', 'from', 'evil', 'amen'].sort();
    expect(pools.get('our-father')!.answers.map((a) => a.answer).sort()).toEqual(expected);
    expect(pools.get('glory-be')!.answers.map((a) => a.answer).sort()).toEqual(['amen', 'as', 'be', 'beginning', 'end', 'ever', 'father', 'glory', 'holy', 'in', 'is', 'it', 'now', 'shall', 'son', 'spirit', 'to', 'was', 'without', 'world'].sort());
  });
});

describe('the questions about facts', () => {
  const answersOf = (kind: string, key: string, pool: string) => derived.find((p) => p.derived!.pool === pool && p.id.endsWith(`.${kind}.${key}`))?.answers.map((a) => a.answer).sort();
  it('popes since 1800 and the books of the prophets are the real sets', () => {
    expect(answersOf('era', '1800', 'popes-since-1500')).toHaveLength(16);
    expect(answersOf('group', 'prophets', 'bible-books')).toHaveLength(18);
  });
  it('every name in a hand-written fact table is on its list', () => {
    for (const t of TABLE_NAMES()) {
      const have = new Set(pools.get(t.pool)!.answers.flatMap((a) => [a.answer, ...(a.aliases ?? [])]));
      for (const n of t.names) expect(have.has(n), `${t.pool}: ${n}`).toBe(true);
    }
  });

});
