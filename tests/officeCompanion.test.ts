import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { norm, sourceText } from '../scripts/chains/verify';
import { HOUR_NOTES, INTERCESSIONS, PARTS, WHY_QUOTES, type Quote } from '../src/data/officeCompanion';

function check(q: Quote): string | null {
  const { text, err } = sourceText({ kind: 'quote', label: q.label, ccc: q.ccc, ref: q.ref, work: q.work, section: q.section } as any);
  if (err) return `${q.label}: ${err}`;
  return norm(text!).includes(norm(q.text)) ? null : `${q.label}: quote not found “${q.text.slice(0, 60)}”`;
}

describe('office companion', () => {
  it('every quotation is found word for word in its bundled source', () => {
    const all = [...WHY_QUOTES, ...PARTS.flatMap((p) => (p.quote ? [p.quote] : []))];
    expect(all.map(check).filter(Boolean)).toEqual([]);
  });
  it('has at least three explainer quotations and a note for each part, with unique ids', () => {
    expect(WHY_QUOTES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(10);
    for (const p of PARTS) { expect(p.what.length).toBeGreaterThan(20); expect(p.why.length).toBeGreaterThan(20); }
  });
  it('has intercessions and names for both hours', () => {
    for (const h of ['lauds', 'vespers'] as const) { expect(INTERCESSIONS[h].length).toBeGreaterThan(2); expect(HOUR_NOTES[h].name).toBeTruthy(); }
  });
  it('the bundled psalter has seven days with lauds and vespers psalms', () => {
    const o = JSON.parse(readFileSync(join(__dirname, '..', 'public', 'data', 'office', 'office.json'), 'utf8'));
    expect(o.days).toHaveLength(7);
    for (const d of o.days) for (const h of ['lauds', 'vespers']) for (const e of d[h].psalms) for (const k of e.ps ?? [e.p]) expect(o.psalms[k]).toBeTruthy();
  });
});
