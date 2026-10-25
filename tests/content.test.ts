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

describe('podcasts', () => {
  it('lists the year-long programmes and shows with playable https audio', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const idx = JSON.parse(readFileSync('public/data/media/podcasts.json', 'utf8'));
    const ids = idx.shows.map((s: any) => s.id);
    for (const id of ['catechism-in-a-year', 'rosary-in-a-year', 'ecdr', 'maronite-readings']) expect(ids, id).toContain(id);
    expect(idx.shows.length).toBeGreaterThanOrEqual(15);
    for (const s of idx.shows) {
      const f = `public/data/media/podcast/${s.id}.json`;
      expect(existsSync(f), f).toBe(true);
      const d = JSON.parse(readFileSync(f, 'utf8'));
      expect(d.episodes.length, s.id).toBeGreaterThan(0);
      for (const e of d.episodes.slice(0, 30)) { expect(e.audio, `${s.id} ${e.title}`).toMatch(/^https:\/\//); expect(e.id).toMatch(/^pod-/); }
    }
    const cat = JSON.parse(readFileSync('public/data/media/podcast/catechism-in-a-year.json', 'utf8'));
    expect(cat.episodes.filter((e: any) => e.ccc?.length).length).toBeGreaterThan(300);
    const days = new Set(cat.episodes.filter((e: any) => e.day).map((e: any) => e.day));
    expect(days.size).toBeGreaterThanOrEqual(360);
  });
});

describe('K–12 catechism curriculum', () => {
  const dir = 'public/data/curriculum';
  it('has thirteen grades with valid lessons', async () => {
    const { parseRefs } = await import('../src/lib/refs');
    const idx = JSON.parse(readFileSync(`${dir}/index.json`, 'utf8')) as { id: string; lessons: number }[];
    const gl = JSON.parse(readFileSync(`${dir}/glossary.json`, 'utf8')) as Record<string, { w: string; d: string }>;
    expect(idx.map((g) => g.id)).toEqual(['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'YA']);
    const prayers = new Set([...readFileSync('src/data/prayerbook.ts', 'utf8').matchAll(/id: '([^']+)'/g)].map((m) => m[1]));
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const g of idx) {
      const d = JSON.parse(readFileSync(`${dir}/grade-${g.id}.json`, 'utf8')) as { units: { lessons: { id: string; ccc: string; scripture: string; vocab: string[]; prayer: string | null; idea: string; question: string; activity: string; quiz?: string[] }[] }[] };
      const lessons = d.units.flatMap((u) => u.lessons);
      expect(lessons.length).toBe(g.lessons);
      expect(lessons.length).toBeGreaterThanOrEqual(24);
      for (const l of lessons) {
        if (seen.has(l.id)) bad.push(`duplicate ${l.id}`);
        seen.add(l.id);
        if (!l.idea || !l.question || !l.activity) bad.push(`${l.id} incomplete`);
        const e = l as unknown as { teach?: string[]; talk?: string[]; life?: string; saint?: string; quiz?: string[] };
        if (!e.teach?.length || !e.talk?.length || !e.life || !e.saint || (e.quiz?.length ?? 0) < 2) bad.push(`${l.id} lacks teaching content`);
        for (const q of l.quiz ?? []) { const p = q.split('|'); if (p.length !== 7 || !(+p[5] >= 0 && +p[5] <= 3)) bad.push(`${l.id} quiz ${q.slice(0, 30)}`); }
        for (const s of l.scripture.split(';')) if (!parseRefs(s.trim()).ok) bad.push(`${l.id} scripture "${s}"`);
        for (const v of l.vocab) if (!gl[v]) bad.push(`${l.id} term ${v}`);
        if (l.prayer && !prayers.has(l.prayer)) bad.push(`${l.id} prayer ${l.prayer}`);
        for (const n of l.ccc.replace(/-/g, ',').split(',').map(Number)) if (!(n >= 1 && n <= 2865)) bad.push(`${l.id} ccc ${n}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
