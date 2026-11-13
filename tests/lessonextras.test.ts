import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const cur = 'public/data/curriculum';
const ids = new Set<string>();
for (const f of readdirSync(cur).filter((x) => /^grade-.*\.json$/.test(x))) for (const u of JSON.parse(readFileSync(`${cur}/${f}`, 'utf8')).units) for (const l of u.lessons) ids.add(l.id);
const featured = JSON.parse(readFileSync(`${cur}/featured.json`, 'utf8')) as { id: string; band: string; q: string }[];
const extras = JSON.parse(readFileSync(`${cur}/lesson-extras.json`, 'utf8')) as Record<string, { tracks: { id: string }[]; watch: { url: string; title: string }[]; read: { url: string }[]; debate: { type: string; id: string }[] }>;

describe('big-question lessons and their media', () => {
  it('every featured lesson exists and has a question', () => {
    expect(featured.length).toBeGreaterThanOrEqual(30);
    for (const f of featured) { expect(ids.has(f.id), f.id).toBe(true); expect(f.q.length, f.id).toBeGreaterThan(10); }
  });
  it('each audience has a good list to choose from', () => {
    for (const band of ['adult', 'teen', 'middle']) expect(featured.filter((f) => f.band === band).length, band).toBeGreaterThanOrEqual(4);
  });
  it('every featured lesson has something to watch or read, and a track to go deeper', () => {
    for (const f of featured) { const e = extras[f.id]; expect(e, f.id).toBeTruthy(); expect(e.watch.length + e.read.length, f.id).toBeGreaterThan(0); expect(e.tracks.length, f.id).toBeGreaterThan(0); }
  });
  it('media is linked at its source with https', () => {
    for (const [id, e] of Object.entries(extras)) { expect(ids.has(id), id).toBe(true); for (const m of [...e.watch, ...e.read]) expect(m.url, id).toMatch(/^https:\/\//); }
  });
});
