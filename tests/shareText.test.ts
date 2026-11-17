import { describe, expect, it } from 'vitest';
import { bankSignature, crownQuestShare, deepWatersShare, ladderShare } from '../src/lib/shareText';

describe('share text', () => {
  it('Deep Waters: a row of creatures, the depth and the set, and no question or answer', () => {
    const t = deepWatersShare({ day: 20774, practice: false, score: 350, rounds: [{ tier: 1, points: 10 }, { tier: null, points: 0 }, { tier: 6, points: 100 }], zone: 'Midnight zone', pearl: true, bank: 'ab12' });
    expect(t).toBe('Deep Waters #20774  350 pts · 3,500 m\n🐟⬛💎 ✨\n🌊 Midnight zone · set ab12');
    expect(deepWatersShare({ day: 1, practice: true, score: 0, rounds: [], zone: 'Sunlight zone', pearl: false, bank: 'x' })).not.toMatch(/#1\b|set /);
  });
  it('the set code changes when the questions change, and not with their order of mention', () => {
    expect(bankSignature(['a', 'b'])).toBe(bankSignature(['a', 'b']));
    expect(bankSignature(['a', 'b'])).not.toBe(bankSignature(['a', 'c']));
    expect(bankSignature(['a', 'b'])).toMatch(/^[0-9a-z]{1,4}$/);
  });
  it('Crown Quest: one emoji per category, earned or empty', () => {
    const t = crownQuestShare({ winner: 'Ann', me: { name: 'Ann', crowns: ['scripture', 'prayer'], right: 12, wrong: 4 }, vs: { name: 'Brother Bot', crowns: ['saints'] }, cats: ['scripture', 'saints', 'history', 'doctrine', 'liturgy', 'prayer'] });
    expect(t).toBe('Crown Quest 👑 Won\n📖⬛⬛⬛⬛🙏  12✔ 4✘\n⬛🕊️⬛⬛⬛⬛  vs Brother Bot');
  });
  it('Doctrine ladder: rows of five', () => { expect(ladderShare({ level: 'Beginner', marks: [true, true, false, true, true, true] })).toBe('Doctrine ladder 🪜 Beginner  5/6\n🟩🟩⬛🟩🟩\n🟩'); });
});
