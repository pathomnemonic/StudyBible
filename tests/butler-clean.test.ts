import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const MONTHS = ['04', '05', '06', '08', '09', '10', '11', '12'];

describe('Butler scanned months', () => {
  const load = (m: string) => JSON.parse(readFileSync(`public/data/saints/butler/${m}.json`, 'utf8')) as { days: Record<string, { text: string[] }[]> };
  it('carry no scanner marks and no known misreadings', () => {
    for (const m of MONTHS) {
      for (const [day, es] of Object.entries(load(m).days)) for (const e of es) for (const p of e.text) {
        expect(p, `${m}-${day}`).not.toMatch(/[\^™~{}|\\<>]/);
        expect(p, `${m}-${day}`).not.toMatch(/\b(tbe|tne|tiie|thej|waa|hia|grod)\b/);
      }
    }
  });
  it('keep the life of St. Leo the Great that the chains quote', () => {
    const t = load('04').days['11'].flatMap((e) => e.text).join(' ');
    expect(t).toContain('In the general consternation, St. Leo');
  });
});
