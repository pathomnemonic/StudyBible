import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { findDeepAnswer } from '../src/lib/deepWaters';

const cases = [
  { id: 'bible-trades', accept: ['Shepherd', 'publican', 'tentmaker'], reject: ['Pharaoh', 'fisherking'] },
  { id: 'bible-foods', accept: ['Bread', 'wheaten flour', 'manna'], reject: ['silver', 'lemon'] },
  { id: 'bible-objects', accept: ['Ark of the Covenant', 'Ark of the Testimony', 'stone tablets'], reject: ['Nineveh', 'golden calfskin'] },
  { id: 'saint-founders', accept: ['Benedict of Nursia', 'Saint Benedict', 'Clare of Assisi'], reject: ['Saint Augustine', 'Saint Benedictine'] },
  { id: 'saint-patronages', accept: ['Saint Christopher', 'Christopher of Lycia', 'Saint Joseph'], reject: ['Saint Paul', 'Christopher Columbus'] },
  { id: 'encyclicals', accept: ['Rerum Novarum', 'On New Things', 'Humanae Vitae'], reject: ['Dei Verbum', 'Rerum Novissima'] },
  { id: 'early-heresies', accept: ['Arianism', 'Arian heresy', 'Gnosticism'], reject: ['Nicene Creed', 'Arianisms'] },
  { id: 'liturgical-vestments', accept: ['Alb', 'Chasuble', 'casula'], reject: ['Roman Missal', 'chasubler'] },
  { id: 'liturgical-books', accept: ['Roman Missal', 'Missale Romanum', 'Lectionary'], reject: ['Catechism', 'Roman Missalette'] },
  { id: 'latin-prayers', accept: ['Pater Noster', 'Our Father', 'Ave Maria'], reject: ['Roman Missal', 'Pater Nostrum'] },
  { id: 'church-architecture', accept: ['Nave', 'sanctuary apse', 'transept'], reject: ['Chalice', 'navel'] },
  { id: 'roman-basilicas', accept: ["Saint Peter's Basilica", 'Basilica of Saint Peter', 'Saint Mary Major'], reject: ['Colosseum', "Saint Peter's Cathedral"] },
  { id: 'church-historians', accept: ['Eusebius of Caesarea', 'Eusebius Pamphili', 'Socrates Scholasticus'], reject: ['Saint Peter', 'Eusebius of Antioch'] },
  { id: 'saint-missionaries', accept: ['Francis Xavier', 'Francis de Xavier', 'Patrick of Ireland'], reject: ['Thomas Aquinas', 'Francis Xaverius of Paris'] },
] as const;

describe('Deep Waters Krillion batch 2', () => {
  it('adds fourteen distinct, short, open-ended prompts with broad answer lists', () => {
    const prompts = cases.map(({ id }) => DEEP_WATERS.find((p) => p.id === id));
    expect(prompts.every(Boolean)).toBe(true);
    expect(new Set(prompts.map((p) => p!.prompt)).size).toBe(cases.length);
    for (const p of prompts) {
      expect(p!.prompt.split(/\\s+/).length, p!.id).toBeGreaterThanOrEqual(4);
      expect(p!.prompt.split(/\\s+/).length, p!.id).toBeLessThanOrEqual(14);
      expect(/^(Name|Give)\\b/.test(p!.prompt), p!.id).toBe(true);
      expect(p!.answers.length, p!.id).toBeGreaterThanOrEqual(25);
      expect(new Set(p!.answers.map((a) => a.answer.toLowerCase())).size, p!.id).toBe(p!.answers.length);
      expect(new Set(p!.answers.map((a) => a.tier)).size, p!.id).toBe(6);
      expect(p!.answers.some((a) => a.tier === 1), p!.id).toBe(true);
      expect(p!.answers.some((a) => a.tier >= 5), p!.id).toBe(true);
    }
  });

  for (const c of cases) {
    it(`${c.id}: accepts valid answers and aliases, rejects wrong-category and near-miss inputs`, () => {
      const prompt = DEEP_WATERS.find((p) => p.id === c.id)!;
      expect(c.accept.every((guess) => findDeepAnswer(prompt, guess) !== null), c.id).toBe(true);
      expect(c.reject.every((guess) => findDeepAnswer(prompt, guess) === null), c.id).toBe(true);
      expect(prompt.answers.some((a) => (a.aliases?.length ?? 0) > 0), c.id).toBe(true);
    });
  }
});
