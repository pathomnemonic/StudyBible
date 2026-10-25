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
    expect(d.topics.length).toBeGreaterThan(100);
    const ids = new Set(d.topics.map((t: any) => t.id));
    for (const t of d.topics) {
      expect(t.reading.length, t.id).toBeGreaterThan(0);
      for (const r of t.reading) expect(r.url, t.id).toMatch(/^https:\/\//);
      for (const v of t.verses) expect(parseRefs(v.ref.split(',')[0]).ok, `${t.id}: ${v.ref}`).toBe(true);
      for (const n of t.ccc) expect(ccc.has(n), `${t.id}: CCC ${n}`).toBe(true);
      for (const r of t.related) expect(ids.has(r), `${t.id} -> ${r}`).toBe(true);
    }
  });
});

describe('video catalogue', () => {
  const d = read('public/data/media/videos.json');
  it('lists only checked, embeddable videos with passages that parse', () => {
    expect(d.videos.length).toBeGreaterThan(700);
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

describe('recorded readings', () => {
  const d = read('public/data/media/librivox.json');
  const lib = new Set(read('public/data/library/index.json').works.map((w: any) => w.id));
  it('lists https files for works that exist in the library', () => {
    expect(Object.keys(d.works).length).toBeGreaterThan(40);
    for (const [id, recs] of Object.entries<any>(d.works)) {
      expect(lib.has(id), id).toBe(true);
      for (const r of recs) for (const p of r.parts) expect(p[1], `${id} ${p[0]}`).toMatch(/^https:\/\/.+\.mp3$/);
    }
  });
  it('places the Bible recordings by chapter', async () => {
    const { chaptersOfPart } = await import('../src/data/librivox');
    for (const ed of ['dra', 'webc']) {
      let n = 0;
      for (const p of d.bible[ed].parts) n += chaptersOfPart(p[0]).length;
      expect(n, ed).toBeGreaterThan(1000);
    }
    expect(chaptersOfPart('1 John 1 - 5, 2 John 1, 3 John 1').length).toBe(7);
  });
});

describe('rights and links', () => {
  it('has a rights record for every top-level data item', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const lic = JSON.parse(readFileSync('public/data/licenses.json', 'utf8'));
    const missing = readdirSync('public/data').filter((n) => n !== 'licenses.json' && !(n in lic));
    expect(missing, 'add these to public/data/licenses.json').toEqual([]);
    for (const [k, v] of Object.entries<any>(lic)) if (k !== '_about') { expect(v.license, k).toBeTruthy(); expect(['yes', 'metadata-only', 'none'], k).toContain(v.redistribution); }
  });

  it('every link stored in curated data is a well-formed http(s) address', async () => {
    const { readFileSync } = await import('node:fs');
    const files = ['public/data/apologetics.json', 'public/data/media/videos.json', 'public/data/media/video_library.json'];
    const bad: string[] = [];
    const walk = (v: any, file: string) => {
      if (typeof v === 'string') { if (/^[a-z]+:\/\//i.test(v) || /^javascript:/i.test(v)) { try { const u = new URL(v); if (!['https:', 'http:'].includes(u.protocol)) bad.push(`${file}: ${v}`); } catch { bad.push(`${file}: ${v}`); } } }
      else if (Array.isArray(v)) v.forEach((x) => walk(x, file));
      else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, file));
    };
    for (const f of files) walk(JSON.parse(readFileSync(f, 'utf8')), f);
    expect(bad.slice(0, 5)).toEqual([]);
  });
});
