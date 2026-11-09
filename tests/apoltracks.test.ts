import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateTrack, GROUPS, type Track } from '../src/lib/apolTracks';
import { loadChains } from '../scripts/chains/verify';
import { GLOSSARY } from '../src/data/glossary';

const ROOT = process.cwd();
const DIR = join(ROOT, 'src', 'data', 'apologetics', 'tracks');
const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && (!f.startsWith('_') || !!process.env.APOL_SAMPLE)).sort();
const tracks: Track[] = files.map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));
const json = <T,>(p: string): T => JSON.parse(readFileSync(join(ROOT, 'public', 'data', p), 'utf8'));

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MODES: Record<string, string[]> = { chain: ['arguments', 'development'], claim: ['claims'], heresy: ['heresies'], development: ['development'], words: ['words'] };
const chainIds = (modes: string[]) => new Map(modes.flatMap((m) => loadChains(m)).map((c) => [c.id, c]));
const lessons = new Set<string>(readdirSync(join(ROOT, 'public/data/curriculum')).filter((f) => /^grade-.*\.json$/.test(f)).flatMap((f) => json<{ units: { lessons: { id: string }[] }[] }>(`curriculum/${f}`).units.flatMap((u) => u.lessons.map((l) => l.id))));
const library = new Map(json<{ works: { id: string; sections?: { id: string }[] }[] }>('library/index.json').works.map((w) => [w.id, new Set((w.sections ?? []).map((s) => s.id))]));
const topics = new Set(json<{ topics: { id: string }[] }>('apologetics.json').topics.map((t) => t.id));
const cccHas = (n: number) => json<{ n: number }[]>(`ccc/p${Math.floor(n / 100)}.json`).some((p) => p.n === n);

/** Urls that two tracks may share on purpose (for example the Catechism index). */
const SHARED_OK = new Set<string>([]);
const SHARED_MAX = 4;

const userText = (t: Track): string[] => [t.title, t.tagline, t.whyItMatters, ...t.mindset.map((m) => m.tip),
  ...t.levels.flatMap((l) => [l.title, l.goal, ...l.steps.flatMap((s) => (s.kind === 'reflect' ? [s.prompt] : s.kind === 'drill' ? [] : [s.why]))]),
  ...t.resources.flatMap((r) => [r.title, r.why, r.note ?? ''])];

describe('apologetics tracks', () => {
  it('has track files (or none yet)', () => { expect(Array.isArray(tracks)).toBe(true); });
  it('ids match file names and are unique', () => {
    expect(tracks.map((t) => t.id)).toEqual(files.map((f) => f.replace(/\.json$/, '')));
    expect(new Set(tracks.map((t) => t.id)).size).toBe(tracks.length);
  });
  it('every track has the right shape', () => {
    const bad = tracks.flatMap(validateTrack);
    for (const t of tracks) {
      if (!Array.isArray(t.mindset) || t.mindset.length < 3 || t.mindset.length > 5) bad.push(`${t.id}: mindset needs 3-5 tips`);
      if (!Array.isArray(t.ccc) || !t.ccc.length) bad.push(`${t.id}: ccc list is empty`);
      if (!Array.isArray(t.audience) || !t.audience.length) bad.push(`${t.id}: audience is empty`);
      t.levels?.forEach((l) => {
        if (!l.title || !l.goal || !(l.minutes > 0)) bad.push(`${t.id} level ${l.n}: title/goal/minutes`);
        if (l.steps.filter((s) => s.kind === 'drill').length > 1) bad.push(`${t.id} level ${l.n}: more than one drill`);
        if (l.steps.filter((s) => s.kind === 'reflect').length > 1) bad.push(`${t.id} level ${l.n}: more than one reflect`);
        l.steps.forEach((s, i) => { if (s.kind === 'inapp' && (!s.why || s.why.length < 10 || s.why.length > 200)) bad.push(`${t.id} ${l.n}.${i}: why must be 10-200 characters`); });
      });
      for (const r of t.resources ?? []) {
        const ok = ['video', 'podcast', 'article', 'book', 'course', 'debate', 'talk', 'tract', 'site', 'series'].includes(r.kind);
        if (!ok) bad.push(`${t.id}/${r.id}: unknown kind ${r.kind}`);
        if (typeof r.free !== 'boolean') bad.push(`${t.id}/${r.id}: free must be true or false`);
        if (!(r.level >= 1 && r.level <= 4)) bad.push(`${t.id}/${r.id}: level must be 1-4`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('uses no "above" or "below" in what people read', () => {
    const bad = tracks.flatMap((t) => userText(t).filter((s) => /\b(above|below)\b/i.test(s)).map((s) => `${t.id}: ${s.slice(0, 60)}`));
    expect(bad).toEqual([]);
  });
  it('Catechism numbers exist', () => {
    const bad = tracks.flatMap((t) => t.ccc.filter((n) => !Number.isInteger(n) || n < 1 || n > 2865 || !cccHas(n)).map((n) => `${t.id}: CCC ${n}`));
    expect(bad).toEqual([]);
  });
  it('every in-app item resolves', () => {
    const bad: string[] = [];
    const terms = new Set(GLOSSARY.flatMap((g) => [g.term.toLowerCase(), slug(g.term)]));
    for (const t of tracks) t.levels.forEach((l) => l.steps.forEach((s, i) => {
      const w = `${t.id} ${l.n}.${i}`;
      if (s.kind !== 'inapp') return;
      if (MODES[s.type]) { if (!chainIds(MODES[s.type]).has(s.id)) bad.push(`${w}: no ${s.type} "${s.id}"`); }
      else if (s.type === 'lesson') { if (!lessons.has(s.id)) bad.push(`${w}: no lesson "${s.id}"`); }
      else if (s.type === 'library') {
        const secs = library.get(s.id);
        if (!secs) bad.push(`${w}: no library work "${s.id}"`);
        else if (s.section && !secs.has(s.section)) bad.push(`${w}: no section "${s.section}" in ${s.id}`);
      }
      else if (s.type === 'term') { if (!terms.has(s.id.toLowerCase())) bad.push(`${w}: no glossary term "${s.id}"`); }
      else if (s.type === 'apologetics') { if (!topics.has(s.id)) bad.push(`${w}: no apologetics topic "${s.id}"`); }
      else if (s.type === 'ask') { if (!s.id.trim() || s.id.length > 200) bad.push(`${w}: ask needs a question`); }
      else bad.push(`${w}: unknown type ${(s as { type: string }).type}`);
    }));
    expect(bad).toEqual([]);
  });
  it('every drill points at a chain or claim with objections', () => {
    const bad: string[] = [];
    for (const t of tracks) t.levels.forEach((l) => l.steps.forEach((s, i) => {
      if (s.kind !== 'drill') return;
      const c = chainIds(s.source.type === 'claim' ? ['claims'] : ['arguments', 'development']).get(s.source.id);
      if (!c) bad.push(`${t.id} ${l.n}.${i}: no ${s.source.type} "${s.source.id}"`);
      else if (!c.objections?.length) bad.push(`${t.id} ${l.n}.${i}: "${s.source.id}" has no objections`);
    }));
    expect(bad).toEqual([]);
  });
  it('urls are not repeated across tracks unless intended', () => {
    const seen = new Map<string, string[]>();
    for (const t of tracks) for (const r of t.resources) { const k = r.url.replace(/\/+$/, '').toLowerCase(); seen.set(k, [...(seen.get(k) ?? []), t.id]); }
    const bad = [...seen].filter(([u, ts]) => !SHARED_OK.has(u) && new Set(ts).size > 1 && ts.length > SHARED_MAX).map(([u, ts]) => `${u} in ${[...new Set(ts)].join(', ')}`);
    expect(bad).toEqual([]);
  });
  it('prints a coverage summary', () => {
    const rows = GROUPS.map((g) => `${g.id}: ${tracks.filter((t) => t.group === g.id).map((t) => t.id).join(', ') || '(none)'}`);
    const res = tracks.reduce((a, t) => a + t.resources.length, 0);
    const steps = tracks.reduce((a, t) => a + t.levels.reduce((b, l) => b + l.steps.length, 0), 0);
    console.log(`Apologetics tracks: ${tracks.length}, resources ${res}, steps ${steps}\n${rows.join('\n')}`);
    expect(true).toBe(true);
  });
});
