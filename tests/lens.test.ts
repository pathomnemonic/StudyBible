import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(__dirname, '..', 'public', 'data', 'lens')

describe('lens datasets', () => {
  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  it('has datasets', () => expect(files.length).toBeGreaterThan(0))
  for (const f of files) {
    it(`${f} is non-empty with refs and text`, () => {
      const raw = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      const list = Array.isArray(raw) ? raw : raw.entries ?? raw.items
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBeGreaterThan(0)
      for (const e of list) expect(JSON.stringify(e).length).toBeGreaterThan(20)
    })
  }
})

describe('sacred art', () => {
  const root = join(__dirname, '..', 'public');
  const art = JSON.parse(readFileSync(join(root, 'data', 'art.json'), 'utf8'));
  it('has a bundled image, provenance and a Met page for every work', () => {
    expect(art.works.length).toBeGreaterThan(20);
    for (const w of art.works) {
      expect(() => readFileSync(join(root, w.file))).not.toThrow();
      expect(w.page).toMatch(/^https:\/\/www\.metmuseum\.org\//);
      expect(w.credit).toBeTruthy();
    }
  });
  it('lens art entries point at works that exist', () => {
    const ids = new Set(art.works.map((w: { id: number }) => w.id));
    const lens = JSON.parse(readFileSync(join(root, 'data', 'lens', 'art.json'), 'utf8'));
    for (const e of lens.entries) expect(ids.has(e.work)).toBe(true);
  });
});

describe('manuscripts', () => {
  const ms = JSON.parse(readFileSync(join(__dirname, '..', 'public', 'data', 'manuscripts.json'), 'utf8'));
  it('are hosted by the museum with a catalogue page and credit', () => {
    expect(ms.works.length).toBeGreaterThan(5);
    for (const w of ms.works) {
      expect(w.images.length).toBeGreaterThan(0);
      for (const u of w.images) expect(u).toMatch(/^https:\/\/images\.metmuseum\.org\//);
      expect(w.page).toMatch(/^https:\/\/www\.metmuseum\.org\//);
      expect(w.credit).toBeTruthy();
    }
  });
});

describe('typology', () => {
  const root = join(__dirname, '..', 'public', 'data');
  const t = JSON.parse(readFileSync(join(root, 'lens', 'typology.json'), 'utf8'));
  it('has entries on both sides with verbatim quotes from library works', () => {
    expect(t.entries.length).toBeGreaterThan(15);
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    for (const e of t.entries) {
      expect(e.a.length).toBeGreaterThan(0);
      expect(e.b.length).toBeGreaterThan(0);
      for (const q of e.quotes) {
        const w = JSON.parse(readFileSync(join(root, 'library', 'works', `${q.work}.json`), 'utf8'));
        expect(w.sections[q.section].paras.some((p: string) => norm(p).includes(norm(q.text)))).toBe(true);
      }
    }
  });
});
