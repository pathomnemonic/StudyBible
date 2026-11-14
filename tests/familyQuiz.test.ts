import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildFamilyQuiz } from '../src/lib/familyQuiz';

const persons = JSON.parse(readFileSync('public/data/reference/genealogies.json', 'utf8')).persons;
describe('Family ties quiz', () => {
  it('is repeatable for a seed', () => {
    expect(buildFamilyQuiz(persons, 3)).toEqual(buildFamilyQuiz(persons, 3));
  });
  it('asks six questions, each with four different options and a correct answer taken from the data', () => {
    for (const seed of [1, 2, 3, 10, 777]) {
      const qs = buildFamilyQuiz(persons, seed);
      expect(qs).toHaveLength(6);
      for (const q of qs) {
        expect(new Set(q.options).size).toBe(4);
        const m = /Who was the (father|mother) of (.+)\?/.exec(q.text)!;
        const child = persons.find((p: any) => p.n === m[2]);
        const parent = persons.find((p: any) => p.id === (m[1] === 'father' ? child.f : child.m));
        expect(q.options[q.answer]).toBe(parent.n);
        expect(child.note).toBeUndefined();
      }
    }
  });
  it('never asks about the same person twice in a round', () => {
    const qs = buildFamilyQuiz(persons, 5);
    expect(new Set(qs.map((q) => q.text.split(' of ')[1])).size).toBe(qs.length);
  });
});
