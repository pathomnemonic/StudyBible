import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { buildMenu, ideasOf, totalMinutes, SETUPS, type Setup } from '../src/curriculum/options';
import { KIT_RANK } from '../src/curriculum/techniques';
import { BANDS } from '../src/curriculum/pedagogy';

const gl = JSON.parse(readFileSync('public/data/curriculum/glossary.json', 'utf8'));
const grades = readdirSync('public/data/curriculum').filter((f) => /^grade-.*\.json$/.test(f)).map((f) => JSON.parse(readFileSync(`public/data/curriculum/${f}`, 'utf8')));
const lessons = grades.flatMap((g: any) => g.units.flatMap((u: any) => u.lessons.map((l: any) => ({ g, l }))));
const SETS = SETUPS.map(([s]) => s) as Setup[];

describe('teaching options for every lesson', () => {
  it('covers all lessons', () => expect(lessons.length).toBeGreaterThanOrEqual(408));
  it('gives every idea at least three different ways to teach it, in every setup', () => {
    const bad: string[] = [];
    for (const { g, l } of lessons) for (const s of SETS) {
      const m = buildMenu(l, g.band, gl, s);
      if (m.concepts.length !== ideasOf(l).length) bad.push(`${l.id} concept count`);
      for (const c of m.concepts) { if (c.options.length < 3) bad.push(`${l.id} ${s} idea ${c.n}: ${c.options.length}`); if (new Set(c.options.map((o) => o.id)).size !== c.options.length) bad.push(`${l.id} ${s} duplicate option`); }
      if (m.opening.length < 2) bad.push(`${l.id} ${s} opening ${m.opening.length}`);
      if (m.closing.length < 2) bad.push(`${l.id} ${s} closing ${m.closing.length}`);
    }
    expect(bad.slice(0, 15)).toEqual([]);
  });
  it('never asks for more than the teacher has', () => {
    for (const { g, l } of lessons) for (const s of SETS) {
      const m = buildMenu(l, g.band, gl, s);
      for (const o of [...m.opening, ...m.concepts.flatMap((c) => c.options), ...m.closing]) expect(KIT_RANK[o.kit], `${l.id} ${s} ${o.id}`).toBeLessThanOrEqual(KIT_RANK[s]);
    }
  });
  it('writes complete, readable steps with no template leftovers', () => {
    const bad: string[] = [];
    for (const { g, l } of lessons) for (const s of ['voice', 'devices'] as Setup[]) {
      const m = buildMenu(l, g.band, gl, s);
      for (const o of [...m.opening, ...m.concepts.flatMap((c) => c.options), ...m.closing]) {
        const text = [o.title, o.prep, ...o.steps, o.without ?? '', o.tip ?? ''].join(' ');
        if (o.steps.length < 2 && o.id !== 'fist5') bad.push(`${l.id} ${o.id} too few steps`);
        if (/undefined|\[object|NaN|\$\{|“”|{ *}/.test(text)) bad.push(`${l.id} ${o.id}: ${text.match(/undefined|\[object|NaN|\$\{|“”/)}`);
        if (o.minutes < 1 || o.minutes > 25) bad.push(`${l.id} ${o.id} minutes ${o.minutes}`);
      }
    }
    expect(bad.slice(0, 15)).toEqual([]);
  });
  it('mixes kinds of teaching within each idea', () => {
    for (const { g, l } of lessons) { const m = buildMenu(l, g.band, gl, 'devices'); for (const c of m.concepts) expect(new Set(c.options.map((o) => o.move)).size, `${l.id} idea ${c.n}`).toBeGreaterThanOrEqual(2); }
  });
  it('feels different from lesson to lesson', () => {
    let same = 0, total = 0;
    for (const g of grades) {
      const ls = g.units.flatMap((u: any) => u.lessons);
      for (let i = 1; i < ls.length; i++) { const a = buildMenu(ls[i - 1], g.band, gl, 'paper').concepts.flatMap((c) => c.options.map((o) => o.id)).join(); const b = buildMenu(ls[i], g.band, gl, 'paper').concepts.flatMap((c) => c.options.map((o) => o.id)).join(); total++; if (a === b) same++; }
    }
    expect(same / total).toBeLessThan(0.02);
  });
  it('is the same on every call (stable choices)', () => {
    const { g, l } = lessons[100];
    expect(JSON.stringify(buildMenu(l, g.band, gl, 'screen'))).toBe(JSON.stringify(buildMenu(l, g.band, gl, 'screen')));
  });
  it('uses the lesson’s own words in the steps', () => {
    let hit = 0;
    for (const { g, l } of lessons) { const m = buildMenu(l, g.band, gl, 'paper'); const text = m.concepts.flatMap((c) => c.options.flatMap((o) => o.steps)).join(' ').toLowerCase(); if (text.includes(l.question.toLowerCase().slice(0, 20)) || m.concepts.some((c) => text.includes(c.term.toLowerCase()))) hit++; }
    expect(hit / lessons.length).toBeGreaterThan(0.95);
  });
  it('plans fit a sensible share of the class time', () => {
    let over = 0;
    for (const { g, l } of lessons) { const band = BANDS.find((b) => b.id === g.band)!; if (totalMinutes(buildMenu(l, g.band, gl, 'paper'), {}) > band.minutes * 1.6) over++; }
    expect(over / lessons.length).toBeLessThan(0.15);
  });
});

import { firstSentence, fitToTime } from '../src/curriculum/options';
describe('helpers', () => {
  it('does not cut a sentence at an abbreviation or a verse', () => {
    expect(firstSentence('Early witnesses such as Clement of Rome (c. AD 96) wrote to Corinth. Another sentence.')).toBe('Early witnesses such as Clement of Rome (c. AD 96) wrote to Corinth.');
    expect(firstSentence('Read Matthew 16:13-19 slowly with the class. Then ask why.')).toBe('Read Matthew 16:13-19 slowly with the class.');
  });
  it('fits a plan to the class time when a shorter option exists', () => {
    const { g, l } = lessons[200]; const m = buildMenu(l, g.band, gl, 'paper');
    const full = totalMinutes(m, {}); const fit = fitToTime(m, {}, Math.round(full * 0.7));
    expect(totalMinutes(m, fit)).toBeLessThan(full);
    expect(fitToTime(m, {}, 1000)).toEqual({});
  });
});
