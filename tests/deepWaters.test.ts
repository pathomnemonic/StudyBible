import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { GENERATED_DEEP_CANDIDATES } from '../src/lib/deepWatersBankGenerator';
import { dailyDeepPrompts, deepWatersCoverageErrors, deepWatersCoverageReport, DEEP_ANSWER_TARGET, DEEP_POINTS, DEEP_ROUNDS, DEEP_SECONDS, findDeepAnswer, normalizeDeepAnswer, practiceDeepPrompts, suggestDeepAnswers } from '../src/lib/deepWaters';

describe('Deep Waters content and rules', () => {
  it('has enough distinct Catholic prompts for a full 365-day year', () => {
    expect(DEEP_WATERS.length).toBeGreaterThanOrEqual(365 * DEEP_ROUNDS);
    expect(DEEP_ROUNDS).toBe(7);
    expect(DEEP_SECONDS).toBe(30);
    expect(new Set(DEEP_WATERS.map((p) => p.id)).size).toBe(DEEP_WATERS.length);
    for (const p of DEEP_WATERS) {
      expect(p.prompt.trim().length, p.id).toBeGreaterThan(12);
      expect(p.hint.trim().length, p.id).toBeGreaterThan(20);
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(p.answerMode === 'single' ? 1 : 10);
      if (p.answerMode === 'single') expect(p.source, p.id).toBeTruthy();
      expect(new Set(p.answers.map((a) => normalizeDeepAnswer(a.answer))).size, p.id).toBe(p.answers.length);
      for (const a of p.answers) expect([1, 2, 3, 4, 5]).toContain(a.tier);
    }
  });


  it('uses a fully hand-authored open-ended bank with bounded categories and curated answer keys', () => {
    const authored = DEEP_WATERS.filter((p) => p.id.startsWith('authored-'));
    expect(authored).toHaveLength(25);
    expect(new Set(authored.map((p) => p.theme)).size).toBeGreaterThanOrEqual(15);
    const byId = (id: string) => authored.find((p) => p.id === id)!;
    expect(byId('authored-eastern-catholic-churches').answers).toHaveLength(23);
    expect(byId('authored-doctors-of-church').answers).toHaveLength(38);
    expect(byId('authored-ecumenical-councils').answers).toHaveLength(21);
    expect(byId('authored-works-of-mercy').answers).toHaveLength(14);
    expect(byId('authored-judges-of-israel').answers).toHaveLength(12);
    expect(byId('authored-pauline-letters').answers).toHaveLength(13);
    expect(byId('authored-deuterocanonical-books').answers).toHaveLength(12);

    for (const prompt of authored) {
      expect(prompt.source, prompt.id).toMatch(/^Hand-authored answer key; sources:/);
      expect(prompt.answerMode).toBe('many');
      expect(prompt.context.trim().length).toBeGreaterThan(30);
      expect(prompt.hint.trim().length).toBeGreaterThan(20);
      expect(prompt.answers.length, prompt.id).toBeGreaterThanOrEqual(10);
      const answerKeys = prompt.answers.map((a) => normalizeDeepAnswer(a.answer));
      expect(new Set(answerKeys).size, prompt.id).toBe(answerKeys.length);
      const accepted = new Map<string, string>();
      for (const answer of prompt.answers) {
        for (const value of [answer.answer, ...(answer.aliases ?? [])]) {
          const key = normalizeDeepAnswer(value);
          expect(accepted.has(key) ? accepted.get(key) : answer.answer, prompt.id + ': ' + value).toBe(answer.answer);
          accepted.set(key, answer.answer);
        }
      }
    }
  });
  it('daily prompts are stable, unique and change with the seed', () => {
    const a = dailyDeepPrompts(20600), b = dailyDeepPrompts(20600), c = dailyDeepPrompts(20601);
    expect(a).toEqual(b);
    expect(a).toHaveLength(DEEP_ROUNDS);
    expect(new Set(a.map((p) => p.id)).size).toBe(DEEP_ROUNDS);
    expect(c.map((p) => p.id)).not.toEqual(a.map((p) => p.id));
  });

  it('simulates 365 days with unique daily prompts and balanced bank rotation', () => {
    const counts = new Map(DEEP_WATERS.map((p) => [p.id, 0]));
    let previous = new Set<string>();
    const yearIds = new Set<string>();
    for (let day = 1; day <= 365; day++) {
      const current = dailyDeepPrompts(day);
      const ids = current.map((p) => p.id);
      expect(new Set(ids).size, `duplicate on day ${day}`).toBe(DEEP_ROUNDS);
      for (const id of ids) {
        expect(yearIds.has(id), `prompt reused during 365-day year: ${id}`).toBe(false);
        yearIds.add(id);
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      if (day > 1) {
        const overlap = ids.filter((id) => previous.has(id)).length;
        expect(overlap).toBe(Math.max(0, DEEP_ROUNDS * 2 - DEEP_WATERS.length));
      }
      previous = new Set(ids);
    }
    expect(yearIds.size).toBe(365 * DEEP_ROUNDS);
    const frequencies = [...counts.values()];
    expect(Math.max(...frequencies) - Math.min(...frequencies)).toBeLessThanOrEqual(1);
  });

  it('practice sets are reproducible without changing the daily set', () => {
    expect(practiceDeepPrompts(123)).toEqual(practiceDeepPrompts(123));
    expect(dailyDeepPrompts(123)).not.toEqual(practiceDeepPrompts(123));
  });

  it('accepts every curated answer and alias and rejects a non-answer for every prompt', () => {
    for (const prompt of DEEP_WATERS) {
      for (const entry of prompt.answers) {
        expect(findDeepAnswer(prompt, entry.answer)?.answer, prompt.id + ': ' + entry.answer).toBe(entry.answer);
        for (const alias of entry.aliases ?? []) {
          expect(findDeepAnswer(prompt, alias)?.answer, prompt.id + ' alias: ' + alias).toBe(entry.answer);
        }
      }
      expect(findDeepAnswer(prompt, '__not_a_real_catholic_answer_74291__'), prompt.id).toBeNull();
    }
  });

  it('matches normalized answers and aliases, but does not guess at partial strings', () => {
    const churches = DEEP_WATERS.find((p) => p.id === 'authored-eastern-catholic-churches')!;
    expect(findDeepAnswer(churches, '  MELKITE CHURCH ' )?.answer).toBe('Melkite Greek Catholic Church');
    expect(findDeepAnswer(churches, 'Syriac Catholic Church')?.answer).toBe('Syriac Catholic Church');
    expect(findDeepAnswer(churches, 'Maron')).toBeNull();
    expect(findDeepAnswer(churches, '')).toBeNull();
  });

  it('offers spelling suggestions without accepting them automatically', () => {
    const councils = DEEP_WATERS.find((p) => p.id === 'authored-ecumenical-councils')!;
    expect(suggestDeepAnswers(councils, 'Nicaea')).toHaveLength(0);
    const places = DEEP_WATERS.find((p) => p.id === 'authored-acts-cities')!;
    const suggestions = suggestDeepAnswers(places, 'Damascu');
    expect(suggestions[0]?.answer).toBe('Damascus');
    expect(findDeepAnswer(places, 'Damascu')).toBeNull();
    expect(suggestDeepAnswers(places, 'xyz')).toEqual([]);
  });

  it('recognizes common valid answers from player review and labels the key as curated', () => {
    const byId = (id: string) => DEEP_WATERS.find((p) => p.id === id)!;
    const cases: Array<[string, string, string]> = [
      ['authored-resurrection-witnesses', 'Mary Magdalene', 'Mary Magdalene'],
      ['authored-resurrection-witnesses', 'Cephas', 'Peter'],
      ['authored-pauline-letters', 'First Corinthians', '1 Corinthians'],
      ['authored-pauline-letters', 'Second Timothy', '2 Timothy'],
      ['authored-ecumenical-councils', 'Vatican II', 'Second Vatican Council'],
      ['authored-ecumenical-councils', 'Lateran I', 'First Lateran Council'],
      ['authored-acts-cities', 'Damascus', 'Damascus'],
      ['authored-acts-cities', 'Athens', 'Athens'],
      ['authored-acts-cities', 'Rome', 'Rome'],
      ['authored-luke-parables', 'Good Samaritan', 'The Good Samaritan'],
      ['authored-marian-litany', 'Seat of Wisdom', 'Seat of wisdom'],
      ['authored-marian-litany', 'Morning Star', 'Morning star'],
    ];
    for (const [id, guess, expected] of cases) {
      expect(findDeepAnswer(byId(id), guess)?.answer, id + ': ' + guess).toBe(expected);
    }
  });

  it('generates a provenance-backed candidate bank without inventing rarity tiers', () => {
    expect(GENERATED_DEEP_CANDIDATES.length).toBeGreaterThan(100);
    const keys = GENERATED_DEEP_CANDIDATES.map((row) => row.category + ':' + normalizeDeepAnswer(row.answer));
    expect(new Set(keys).size).toBe(keys.length);
    for (const row of GENERATED_DEEP_CANDIDATES) {
      expect(row.answer.trim().length).toBeGreaterThan(1);
      expect(row.source.trim().length).toBeGreaterThan(0);
      expect(row.sourceId.trim().length).toBeGreaterThan(0);
      expect(row.evidence.trim().length).toBeGreaterThan(0);
      expect(row.reviewStatus).toBe('needs-review');
      expect(row.tier).toBeNull();
    }
  });

  it('reports underfilled draft prompts and gates reviewed prompts below forty answers', () => {
    const report = deepWatersCoverageReport();
    expect(report).toHaveLength(DEEP_WATERS.length);
    expect(report.every((row) => row.status === 'draft')).toBe(true);
    expect(report.some((row) => !row.meetsTarget)).toBe(true);
    expect(report.filter((row) => row.target === 1)).toHaveLength(2555);
    expect(deepWatersCoverageErrors()).toEqual([]);
    const underfilled = { ...DEEP_WATERS[0], status: 'reviewed' as const, answers: DEEP_WATERS[0].answers.slice(0, DEEP_ANSWER_TARGET - 1) };
    expect(deepWatersCoverageErrors([underfilled])).toHaveLength(1);
    const ready = { ...DEEP_WATERS[0], status: 'reviewed' as const, answers: Array.from({ length: DEEP_ANSWER_TARGET }, (_, i) => ({ answer: `answer-${i}`, tier: 1 as const })) };
    expect(deepWatersCoverageErrors([ready])).toEqual([]);
  });

  it('uses an explicit increasing editorial score ladder', () => {
    expect([1, 2, 3, 4, 5].map((n) => DEEP_POINTS[n as 1 | 2 | 3 | 4 | 5])).toEqual([1, 2, 4, 8, 16]);
  });
});
