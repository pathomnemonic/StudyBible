import { describe, expect, it } from 'vitest';
import { NAME_SAINTS } from '../src/data/confirmationSaints';
import { rank } from '../src/pages/study/ConfirmationNamePage';

describe('confirmation name saints', () => {
  it('have valid feast dates and no repeated names', () => {
    expect(NAME_SAINTS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(NAME_SAINTS.map((s) => s.name)).size).toBe(NAME_SAINTS.length);
    for (const s of NAME_SAINTS) {
      expect(s.feast, s.name).toMatch(/^\d{2}-\d{2}$/);
      const d = new Date(Date.UTC(2024, +s.feast.slice(0, 2) - 1, +s.feast.slice(3)));
      expect(d.getUTCMonth() + 1, s.name).toBe(+s.feast.slice(0, 2));
      expect(s.why.length, s.name).toBeGreaterThan(20);
      expect(s.tags.length, s.name).toBeGreaterThan(1);
    }
  });
  it('ranks saints by the answers and honors a chosen gender', () => {
    const r = rank(['youth', 'courage', 'g:f']);
    expect(r.length).toBeGreaterThan(2);
    expect(r.every((s) => s.g === 'f')).toBe(true);
    expect(r[0].tags.includes('youth') && r[0].tags.includes('courage')).toBe(true);
  });
});

import { clueFor, redact } from '../src/pages/play/SaintGuessPage';
describe('Saint Guess clues', () => {
  it('never give the name away before the last clue', () => {
    for (const s of NAME_SAINTS) {
      const key = s.name.replace(/\(.*?\)/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !/^(of|the|and|great)$/i.test(w));
      for (let n = 0; n < 4; n++) for (const w of key) expect(clueFor(s, n).toLowerCase().includes(w.toLowerCase()), `${s.name} clue ${n}`).toBe(false);
    }
  });
  it('hides a name inside a description', () => { expect(redact('Francis gave up wealth.', 'Francis of Assisi')).toBe('___ gave up wealth.'); });
});

import { WHO_AM_I } from '../src/data/whoami';
import { accepts } from '../src/pages/play/WhoAmIPage';
describe('Who Am I', () => {
  it('has distinct people, five clues each, and never names them in a clue', () => {
    expect(WHO_AM_I.length).toBeGreaterThanOrEqual(40);
    expect(new Set(WHO_AM_I.map((p) => p.name)).size).toBe(WHO_AM_I.length);
    for (const p of WHO_AM_I) {
      expect(p.clues.length, p.name).toBe(5);
      const first = p.name.split(' ')[0].toLowerCase();
      for (const c of p.clues.slice(0, 4)) expect(new RegExp(`\\b${first}\\b`, 'i').test(c), `${p.name}: ${c}`).toBe(false);
    }
  });
  it('accepts alternative names and ignores case and “the”', () => {
    const peter = WHO_AM_I.find((p) => p.name === 'Peter')!;
    expect(accepts(peter, 'simon peter')).toBe(true);
    expect(accepts(peter, ' PETER ')).toBe(true);
    expect(accepts(peter, 'paul')).toBe(false);
  });
});

import { actionFor, genreOf, questionsFor, quoteOf } from '../src/lib/familySheet';
describe('family sheet', () => {
  it('recognizes a parable, a miracle and a teaching', () => {
    expect(genreOf('Jesus told them a parable: the kingdom of heaven is like ten virgins')).toBe('parable');
    expect(genreOf('He healed the blind man and the leper')).toBe('miracle');
    expect(genreOf('“I am the bread of life,” he said. Truly, truly, I say to you')).toBe('teaching');
    expect(genreOf('They went to the town and stayed the night.')).toBe('story');
  });
  it('gives questions for every age and genre, and finds the first words spoken', () => {
    for (const g of ['parable', 'miracle', 'teaching', 'story'] as const) for (const l of ['little', 'middle', 'older'] as const) expect(questionsFor(g, l).length).toBeGreaterThanOrEqual(4);
    expect(actionFor('miracle').length).toBeGreaterThan(20);
    expect(quoteOf('He said, “Let the children come to me and do not hinder them.”')).toBe('Let the children come to me and do not hinder them.');
    expect(quoteOf('No quote here.')).toBeNull();
  });
});

import { cardsFor } from '../src/pages/BellRingersPage';
describe('bell ringers', () => {
  it('turns a lesson into a think, recall, check and myth card', () => {
    const c = cardsFor({ title: 'Sacraments', question: 'What is a sign?', mem: '“Take heart.”', quiz: ['A sacrament…|A sign|A school|A rule|A song|0|CCC 1131.'], misc: ['“Sacraments are magic.”'] }, 'Unit 1');
    expect(c.map((x) => x.kind)).toEqual(['think', 'recall', 'check', 'myth']);
    expect(c[2].answer).toBe('A sign');
  });
});
