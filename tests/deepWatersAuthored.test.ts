import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { AUTHORED_PROMPTS } from '../src/data/deepWatersAuthored';
import { matchDeepAnswer } from '../src/lib/deepWaters';

const P = (id: string) => DEEP_WATERS.find((p) => p.id === id)!;
const status = (id: string, guess: string) => matchDeepAnswer(P(id), guess).status;

describe('the hand-written Deep Waters questions', () => {
  it('are in the bank, each with a theme, a basis and a one-sentence context', () => {
    expect(AUTHORED_PROMPTS).toHaveLength(14);
    for (const p of AUTHORED_PROMPTS) {
      expect(DEEP_WATERS.map((x) => x.id)).toContain(p.id);
      expect(p.id).toMatch(/^authored-/);
      expect(p.basis?.length ?? 0, p.id).toBeGreaterThan(15);
      expect(p.prompt.split(/\s+/).length, p.id).toBeLessThanOrEqual(20);
      expect(p.context.length, p.id).toBeLessThan(220);
      expect(`${p.prompt} ${p.context}`, p.id).not.toMatch(/\b(above|below)\b/i);
    }
  });
  it('have no duplicate answers and no alias that is another answer', () => {
    for (const p of AUTHORED_PROMPTS) {
      const seen = new Map<string, string>();
      for (const a of p.answers) for (const s of [a.answer, ...(a.aliases ?? [])]) {
        const k = s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        expect(seen.get(k) ?? a.answer, `${p.id}: "${s}" is used by two answers`).toBe(a.answer);
        seen.set(k, a.answer);
      }
    }
  });
  it('name the closed sets exactly', () => {
    const names = (id: string) => P(id).answers.map((a) => a.answer);
    expect(names('authored-pauline-letters')).toEqual(expect.arrayContaining(['Romans', 'Galatians', 'Philemon']));
    expect(names('authored-pauline-letters')).not.toContain('Hebrews');
    expect(P('authored-pauline-letters').closed).toBe(13);
    expect(names('authored-romans16-women')).toEqual(expect.arrayContaining(['Phoebe', 'Junia', 'Persis']));
    expect(names('authored-women-in-acts')).not.toEqual(expect.arrayContaining(['Drusilla']));
  });
  it('accept what a reasonable player would say, and reject what is out of scope', () => {
    const accept: [string, string][] = [
      ['authored-luke-parables', 'the good samaritan'], ['authored-luke-parables', 'prodigal son'], ['authored-luke-parables', 'rich fool'], ['authored-luke-parables', 'lost coin'],
      ['authored-pauline-letters', 'romans'], ['authored-pauline-letters', 'first corinthians'], ['authored-pauline-letters', 'titus'],
      ['authored-resurrection-witnesses', 'mary magdalene'], ['authored-resurrection-witnesses', 'thomas'], ['authored-resurrection-witnesses', 'the women at the tomb'], ['authored-resurrection-witnesses', 'paul'],
      ['authored-marian-litany', 'queen of peace'], ['authored-marian-litany', 'mother most admirable'], ['authored-marian-litany', 'tower of ivory'], ['authored-marian-litany', 'refuge of sinners'], ['authored-marian-litany', 'queen of the rosary'],
      ['authored-prophets-before-kings', 'nathan'], ['authored-prophets-before-kings', 'elijah'], ['authored-prophets-before-kings', 'isaiah'],
      ['authored-jesus-healings', 'leprosy'], ['authored-jesus-healings', 'blindness'], ['authored-jesus-healings', 'paralysis'],
      ['authored-johannine-titles', 'bread of life'], ['authored-johannine-titles', 'good shepherd'], ['authored-johannine-titles', 'lamb of god'], ['authored-johannine-titles', 'the word'],
      ['authored-revelation-images', 'the seven trumpets'], ['authored-revelation-images', 'the new jerusalem'], ['authored-revelation-images', 'the lamb'],
      ['authored-women-in-acts', 'lydia'], ['authored-women-in-acts', 'dorcas'], ['authored-women-in-acts', 'sapphira'],
      ['authored-liturgical-observances', 'good friday'], ['authored-liturgical-observances', 'pentecost'], ['authored-liturgical-observances', 'immaculate conception'],
      ['authored-early-martyrs', 'perpetua'], ['authored-early-martyrs', 'saint stephen'], ['authored-early-martyrs', 'polycarp'],
      ['authored-pauls-first-journey', 'cyprus'], ['authored-pauls-first-journey', 'lystra'],
      ['authored-pauline-coworkers', 'timothy'], ['authored-pauline-coworkers', 'barnabas'], ['authored-romans16-women', 'phoebe'],
    ];
    for (const [id, g] of accept) expect(status(id, g), `${id}: ${g}`).toBe('match');
    const reject: [string, string][] = [
      ['authored-luke-parables', 'the sower'], ['authored-luke-parables', 'the mustard seed'],
      ['authored-pauline-letters', 'hebrews'], ['authored-pauline-letters', 'james'],
      ['authored-women-in-acts', 'drusilla'], ['authored-women-in-acts', 'mary magdalene'],
      ['authored-resurrection-witnesses', 'herod'], ['authored-resurrection-witnesses', 'joanna'],
      ['authored-prophets-before-kings', 'huldah'],
    ];
    for (const [id, g] of reject) expect(status(id, g), `${id}: ${g}`).not.toBe('match');
  });
  it('use the six bands, and the larger open questions use most of them', () => {
    for (const p of AUTHORED_PROMPTS.filter((x) => !x.closed && x.answers.length >= 24)) {
      const tiers = new Set(p.answers.map((a) => a.tier));
      expect(tiers.has(1), p.id).toBe(true);
      expect(tiers.size, p.id).toBeGreaterThanOrEqual(4);
    }
  });
});
