import { describe, expect, it } from 'vitest';
import { bundledDayFor, sameDayTitle } from '../src/liturgy/readings';

describe('the bundled (USCCB) reading list follows the chosen calendar', () => {
  it('shows Thanksgiving Day readings only for the United States calendar', () => {
    const day = { t: 'Thanksgiving Day' };
    expect(bundledDayFor('US', day)).toEqual({ use: true, title: 'Thanksgiving Day' });
    expect(bundledDayFor('universal', day).use).toBe(false);
    expect(bundledDayFor('CA', day).use).toBe(false);
    expect(bundledDayFor('GB', day).use).toBe(false);
  });
  it('keeps the shared readings but not the United States title for US-only observances', () => {
    for (const t of [
      'Memorial of Saint Kateri Tekakwitha, Virgin [In the Dioceses of the United States]',
      'Memorial of Saint Frances Xavier Cabrini, Virgin [In the Dioceses of the United States]',
      'Memorial of St. John Neumann, Bishop',
      'Memorial of Saint Elizabeth Ann Seton, Religious',
      'Day of Prayer for the Legal Protection of Unborn Children',
    ]) {
      const r = bundledDayFor('universal', { t });
      expect(r.use, t).toBe(true);
      expect(r.title, t).toBeUndefined();
      expect(bundledDayFor('US', { t }).title, t).toBe(t);
    }
  });
  it('passes ordinary days through untouched for every calendar', () => {
    const day = { t: 'Thursday of the Thirty-fourth Week in Ordinary Time' };
    expect(bundledDayFor('universal', day)).toEqual({ use: true, title: day.t });
    expect(bundledDayFor('US', day)).toEqual({ use: true, title: day.t });
  });
});

describe('the day is not named twice in two styles', () => {
  it('recognises the same ferial day in computed and published styles', () => {
    expect(sameDayTitle('Thursday of the Thirty-fourth Week in Ordinary Time', 'Thursday of the 34th week in Ordinary Time')).toBe(true);
    expect(sameDayTitle('Monday of the Eighth Week in Ordinary Time', 'Monday of the 8th week in Ordinary Time')).toBe(true);
    expect(sameDayTitle('First Sunday of Advent', 'First Sunday of Advent')).toBe(true);
  });
  it('keeps genuinely different titles distinct', () => {
    expect(sameDayTitle('Thanksgiving Day', 'Thursday of the 34th week in Ordinary Time')).toBe(false);
    expect(sameDayTitle('Memorial of Saint Andrew Dung-Lac, Priest, and Companions, Martyrs', 'Tuesday of the 34th week in Ordinary Time')).toBe(false);
  });
});
