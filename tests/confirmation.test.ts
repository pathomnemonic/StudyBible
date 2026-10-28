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
