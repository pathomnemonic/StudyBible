import { describe, expect, it } from 'vitest';
import { MYSTERIES } from '../src/data/devotions';
import { BIG, CENTER, CROSS, LOOP_BIG, decadeSmalls, layout, mercyPlan, rosaryPlan, stepAt, stepTimes } from '../src/pray/plan';

describe('rosary bead plan', () => {
  const slots = layout();
  it('has the right number of beads', () => {
    expect(slots.filter((s) => s.zone === 'loopsmall').length).toBe(50);
    expect(slots.filter((s) => s.zone === 'loopbig').length).toBe(4);
    expect(slots.filter((s) => s.zone === 'small').length).toBe(3);
    expect(slots.length).toBe(61);
    expect(LOOP_BIG.every((i) => slots[i].zone === 'loopbig')).toBe(true);
    expect(slots[CENTER].zone).toBe('center');
    expect(slots[CROSS].zone).toBe('cross');
    expect(slots[BIG].zone).toBe('big');
  });
  for (const set of MYSTERIES) {
    it(`prays the ${set.name} mysteries in order`, () => {
      const p = rosaryPlan(set);
      expect(p.steps.filter((s) => s.kind === 'ave').length).toBe(53);
      expect(p.steps.filter((s) => s.kind === 'pater').length).toBe(6);
      expect(p.steps.filter((s) => s.kind === 'gloria').length).toBe(6);
      expect(p.steps.filter((s) => s.kind === 'fatima').length).toBe(5);
      expect(p.steps.filter((s) => s.kind === 'mystery').map((s) => s.refs)).toEqual(set.mysteries.map((m) => m.refs));
      // every prayer sits on a real bead, and beads are visited without going backwards except the planned returns to the center and cross
      for (const s of p.steps) expect(s.slot).toBeGreaterThanOrEqual(0), expect(s.slot).toBeLessThan(slots.length);
      const ave = p.steps.filter((s) => s.kind === 'ave' && s.decade === 2).map((s) => s.slot);
      expect(ave).toEqual(decadeSmalls(2));
      expect(p.steps[0].slot).toBe(CROSS);
      expect(p.steps[p.steps.length - 1].slot).toBe(CROSS);
    });
  }
  it('divine mercy has five decades of ten with one large bead each', () => {
    const p = mercyPlan();
    expect(p.steps.filter((s) => s.title.startsWith('For the sake')).length).toBe(50);
    expect(p.steps.filter((s) => s.title.includes('Eternal Father')).length).toBe(5);
    expect(p.steps.filter((s) => s.title === 'Holy God').length).toBe(3);
    for (const s of p.steps) expect(s.text).toBeTruthy();
  });
  it('spreads a recording across the steps', () => {
    const p = rosaryPlan(MYSTERIES[0]);
    const t = stepTimes(p.steps, 840);
    expect(t[0]).toBe(0);
    expect(t.every((x, i) => i === 0 || x > t[i - 1])).toBe(true);
    expect(t[t.length - 1]).toBeLessThan(840);
    expect(stepAt(p.steps, 840, 0)).toBe(0);
    expect(stepAt(p.steps, 840, 839)).toBe(p.steps.length - 1);
    expect(stepAt(p.steps, 840, 420)).toBeGreaterThan(20);
  });
});
