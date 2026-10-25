import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseRefs } from '../src/lib/refs';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('children’s Bible', () => {
  const d = read('public/data/kids_stories.json');
  it('has every story at three levels, with a passage that parses', () => {
    expect(d.stories.length).toBeGreaterThan(40);
    for (const s of d.stories) {
      for (const a of ['4-6', '7-9', '10-12']) expect(s.text[a]?.length, `${s.id} ${a}`).toBeGreaterThan(80);
      expect(s.text['4-6'].length).toBeLessThan(s.text['10-12'].length);
      expect(s.talk.length).toBeGreaterThan(1);
      for (const r of s.refs) expect(parseRefs(r).ok, `${s.id}: ${r}`).toBe(true);
      if (s.memory) expect(parseRefs(s.memory).ok, `${s.id}: ${s.memory}`).toBe(true);
    }
  });
});

describe('questions about the faith', () => {
  const d = read('public/data/apologetics.json');
  const ccc = new Set<number>();
  for (let b = 0; b < 29; b++) for (const p of read(`public/data/ccc/p${b}.json`)) ccc.add(p.n);
  it('cites verses that parse and Catechism paragraphs that exist', () => {
    expect(d.topics.length).toBeGreaterThan(25);
    const ids = new Set(d.topics.map((t: any) => t.id));
    for (const t of d.topics) {
      expect(t.answer.length).toBeGreaterThan(0);
      for (const v of t.verses) expect(parseRefs(v.ref.split(',')[0]).ok, `${t.id}: ${v.ref}`).toBe(true);
      for (const n of t.ccc) expect(ccc.has(n), `${t.id}: CCC ${n}`).toBe(true);
      for (const r of t.related) expect(ids.has(r), `${t.id} -> ${r}`).toBe(true);
    }
  });
});

describe('video catalogue', () => {
  const d = read('public/data/media/videos.json');
  it('lists only checked, embeddable videos with passages that parse', () => {
    expect(d.videos.length).toBeGreaterThan(200);
    const seen = new Set<string>();
    for (const v of d.videos) {
      expect(v.id).toMatch(/^[\w-]{11}$/);
      expect(seen.has(v.id), `duplicate ${v.id}`).toBe(false);
      seen.add(v.id);
      expect(v.channel).toBeTruthy();
      for (const r of v.refs) expect(parseRefs(r).ok, `${v.id}: ${r}`).toBe(true);
    }
  });
});
