import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { norm } from '../scripts/chains/verify';

const daily = JSON.parse(readFileSync('public/data/daily/index.json', 'utf8')) as { generic: Record<string, any>; seasonal: Record<string, any> };
const works = new Map<string, any>();
const work = (id: string) => { if (!works.has(id)) works.set(id, JSON.parse(readFileSync(`public/data/library/works/${id}.json`, 'utf8'))); return works.get(id); };

describe('the saint and Father lines of the day', () => {
  it('every line marked verified against a library work is word for word in the section it cites (the Today screen says so)', () => {
    const bad: string[] = [];
    for (const [kind, group] of Object.entries(daily)) for (const [key, e] of Object.entries(group)) {
      const s = e.saint;
      if (s.verified !== true || !s.src?.work) continue;
      const sec = work(s.src.work).sections[s.src.section];
      const hay = norm([sec?.title ?? '', ...(sec?.paras ?? [])].join(' '));
      for (const seg of String(s.text).split(/…|\.\.\./)) if (norm(seg).length > 20 && !hay.includes(norm(seg))) bad.push(`${kind}/${key}`);
    }
    expect(bad).toEqual([]);
  });
  it('a line listed under more than one saint, with no source, is shown as an uncertain attribution', () => {
    const seen = new Map<string, Set<string>>();
    for (const e of Object.values(daily.generic)) { const t = e.saint.text.toLowerCase().replace(/[^a-z]+/g, ' '); (seen.get(t) ?? seen.set(t, new Set()).get(t)!).add(String(e.saint.who).replace(/ \(.*/, '').replace('St. ', '')); }
    for (const e of Object.values(daily.generic)) {
      const t = e.saint.text.toLowerCase().replace(/[^a-z]+/g, ' ');
      if (e.saint.verified !== true && (seen.get(t)?.size ?? 0) > 1) expect(e.saint.misattributed, e.saint.text).toBeTruthy();
    }
  });
});
