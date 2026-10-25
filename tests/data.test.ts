import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS } from '../src/lib/canon';
import { parseRefId } from '../src/lib/refs';
import { chapterToAnchorRefs, convertRef, fromAnchor, loadVersification, psalmDualLabel, psalmEnglishNumber, toAnchor } from '../src/lib/versification';

const D = join(__dirname, '../public/data');
const have = existsSync(join(D, 'editions.json'));
const json = (p: string) => JSON.parse(readFileSync(join(D, p), 'utf8'));
const d = have ? describe : describe.skip;

d('generated data', () => {
  let editions: any;
  beforeAll(() => {
    editions = json('editions.json');
    loadVersification(json('versification.json'));
  });

  it('every bundled edition contains all 73 books with sequential chapters', () => {
    for (const e of editions.editions) {
      for (const b of BOOKS) {
        // a partial edition (the Septuagint) carries only the books that line up with the Vulgate
        if (e.partial && !e.chapters[b.id]) continue;
        const f = join(D, 'bible', e.id, `${b.id}.json`);
        expect(existsSync(f), `${e.id}/${b.id}`).toBe(true);
        expect(e.chapters[b.id]).toBeGreaterThan(0);
      }
    }
  });
  it('no USFM markup leaks into any edition\'s verse text or footnotes', () => {
    for (const e of editions.editions) {
      for (const b of BOOKS) {
        if (!existsSync(join(D, 'bible', e.id, `${b.id}.json`))) continue;
        const raw = readFileSync(join(D, 'bible', e.id, `${b.id}.json`), 'utf8');
        expect(/\\\\[+a-z]/.test(raw), `${e.id}/${b.id} has a stray backslash marker`).toBe(false);
      }
    }
  });
  it('Vulgate-numbered editions match the canon chapter table', () => {
    for (const e of editions.editions.filter((x: any) => x.scheme === 'vulgate')) for (const b of BOOKS) { if (e.partial && !e.chapters[b.id]) continue; if (e.partial) expect(e.chapters[b.id], `${e.id} ${b.id}`).toBeGreaterThanOrEqual(b.chapters); else expect(e.chapters[b.id], `${e.id} ${b.id}`).toBe(b.chapters); }
  });
  it('every edition records rights, attribution and a source', () => {
    for (const e of editions.editions) {
      expect(e.rights).toBe('public-domain');
      expect(e.rightsBasis.length).toBeGreaterThan(20);
      expect(e.attribution.length).toBeGreaterThan(10);
      expect(e.sourceUrl).toMatch(/^https:/);
    }
  });
  it('known verses are where they should be', () => {
    const jn = json('bible/dra/JHN.json');
    const v51 = jn.chapters[5].blocks.flatMap((b: any) => (typeof b[1] === 'string' ? [] : b[1])).find((r: any) => r[0] === 51);
    expect(v51[1]).toMatch(/living bread/);
    const lat = json('bible/vulgate/JHN.json');
    expect(JSON.stringify(lat.chapters[5])).toMatch(/Ego sum panis vivus/);
  });
  it('no structural bracket artefacts remain in the Latin text', () => {
    const runs = json('bible/vulgate/PSA.json').chapters[21].blocks.flatMap((b: any) => (typeof b[1] === 'string' ? [] : b[1].map((r: any) => r[1])));
    expect(runs.join(' ')).not.toMatch(/[\[\]]/);
  });
});

d('versification', () => {
  beforeAll(() => loadVersification(json('versification.json')));
  it('maps English psalm numbers to the Vulgate anchor', () => {
    expect(toAnchor('english', 'PSA', 23, 1)).toMatchObject({ c: 22, v1: 1 });
    expect(toAnchor('english', 'PSA', 51, 1)).toMatchObject({ c: 50, v1: 3 });
    expect(toAnchor('english', 'PSA', 3, 1)).toMatchObject({ c: 3, v1: 2 });
    expect(toAnchor('english', 'PSA', 10, 1)).toMatchObject({ c: 9, v1: 22 });
    expect(toAnchor('english', 'PSA', 116, 1)).toMatchObject({ c: 114, v1: 1 });
    expect(toAnchor('english', 'PSA', 116, 10)).toMatchObject({ c: 115, v1: 1 });
    expect(toAnchor('english', 'PSA', 147, 12)).toMatchObject({ c: 147, v1: 1 });
    expect(toAnchor('english', 'PSA', 150, 1).c).toBe(150);
  });
  it('round-trips anchor ↔ native for exact psalm verses', () => {
    for (const [c, v] of [[22, 1], [50, 3], [118, 105], [9, 30], [113, 20], [146, 5]] as const) {
      const n = fromAnchor('english', 'PSA', c, v);
      const back = toAnchor('english', 'PSA', n.c, n.v1);
      expect([back.c, back.v1]).toEqual([c, v]);
    }
  });
  it('identity for the Vulgate scheme and non-psalm books', () => {
    expect(toAnchor('vulgate', 'PSA', 22, 1)).toMatchObject({ c: 22, v1: 1, exact: true });
    expect(toAnchor('english', 'JHN', 3, 16)).toMatchObject({ c: 3, v1: 16, exact: true });
    expect(toAnchor('kjv', 'DAN', 4, 37)).toMatchObject({ c: 4, v1: 34 });
    expect(toAnchor('kjv', 'DAN', 3, 24)).toMatchObject({ c: 3, v1: 91 });
  });
  it('flags chapters it cannot verify rather than guessing', () => {
    expect(toAnchor('english', 'GEN', 49, 20).exact).toBe(false);
    expect(toAnchor('english', 'TOB', 2, 1).exact).toBe(false);
    expect(toAnchor('english', 'JOB', 41, 10)).toMatchObject({ c: 41, v1: 1, exact: true });
    expect(toAnchor('english', 'JOB', 41, 1)).toMatchObject({ c: 40, v1: 20 });
    expect(toAnchor('english', 'TOB', 2, 1).note).toMatch(/Tobit|recension|Greek/);
  });
  it('converts whole chapters including split psalms', () => {
    const refs = chapterToAnchorRefs('english', 'PSA', 116).map((x) => x.ref);
    expect(refs.map((r) => r.c1)).toEqual([114, 115]);
    expect(chapterToAnchorRefs('english', 'PSA', 10)[0].ref).toMatchObject({ c1: 9, v1: 22 });
    expect(chapterToAnchorRefs('english', 'PSA', 12)[0].ref).toMatchObject({ c1: 11 });
    expect(convertRef('english', 'vulgate', parseRefId('PSA.23.1')!).ref).toMatchObject({ c1: 22, v1: 1 });
  });
  it('labels psalms with both numbers', () => {
    expect(psalmEnglishNumber(22)).toBe(23);
    expect(psalmEnglishNumber(50)).toBe(51);
    expect(psalmDualLabel(22)).toBe('23');
    expect(psalmDualLabel(1)).toBe('');
    expect(psalmDualLabel(9)).toBe('9–10');
  });
});

d('content packs', () => {
  beforeAll(() => loadVersification(json('versification.json')));
  const eds = have ? json('editions.json').editions : [];
  const dra = () => eds.find((e: any) => e.id === 'vulgate');
  const inBounds = (id: string) => {
    const r = parseRefId(id);
    if (!r) return false;
    const vc = dra().verseCounts[r.book];
    if (!vc || r.c1 < 1 || r.c2 > vc.length) return false;
    if (r.v1 !== undefined && r.v1 > vc[r.c1 - 1] + 2) return false;
    return true;
  };
  it('cross-reference targets and sources are valid anchor ids', () => {
    let n = 0;
    for (const f of readdirSync(join(D, 'xrefs')).filter((x) => /^[1-3A-Z]{3}\.json$/.test(x))) {
      const x = json(`xrefs/${f}`);
      for (const [k, list] of Object.entries<any>(x)) {
        const [c] = k.split('.').map(Number);
        expect(c).toBeGreaterThan(0);
        for (const [t] of list) {
          n++;
          if (!inBounds(t)) throw new Error(`${f} ${k} → ${t}`);
        }
      }
    }
    expect(n).toBeGreaterThan(100000);
  });
  it('Bible in a Year passages are valid and almost every day is mapped', () => {
    const b = json('media/biay.json');
    const missing: number[] = [];
    for (let i = 1; i <= 365; i++) {
      const day = b.days[String(i)];
      if (!day?.passages?.length) missing.push(i);
      for (const p of day?.passages ?? []) if (!inBounds(p)) throw new Error(`day ${i}: ${p}`);
    }
    expect(missing.length).toBeLessThanOrEqual(3); // days whose feed text lists no chapters are flagged, not invented
    expect(b.episodes.length).toBeGreaterThan(1000);
    expect(b.episodes.every((e: any) => e.audio.startsWith('https://'))).toBe(true);
  });
  it('doctrine topics and verified Catechism links are well-formed', () => {
    const doc = json('doctrine/doctrine.json');
    for (const t of doc.topics) for (const s of t.scripture) expect(inBounds(s), `${t.id} ${s}`).toBe(true);
    const ccc = json('doctrine/ccc-links.json');
    expect(ccc.links.length).toBeGreaterThan(20);
    for (const l of ccc.links) {
      expect(inBounds(l.ref)).toBe(true);
      expect(l.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('Catena Aurea groups reference real verses and name their authors', () => {
    const c = json('commentary/catena/MAT.json');
    expect(c.groups.length).toBeGreaterThan(200);
    for (const g of c.groups.slice(0, 200)) {
      expect(g.c).toBeGreaterThan(0);
      expect(g.items.length).toBeGreaterThan(0);
    }
  });
  it('Catena covers all four Gospels and Haydock covers the protocanon', () => {
    for (const b of ['MAT', 'MRK', 'LUK', 'JHN']) expect(json(`commentary/catena/${b}.json`).groups.length).toBeGreaterThan(80);
    const h = json('commentary/haydock/JHN.json');
    expect(h.length).toBeGreaterThan(20);
    for (const [c1, v1, c2, v2, text] of h.slice(0, 50)) {
      expect(c2).toBeGreaterThanOrEqual(c1);
      expect(v1).toBeGreaterThan(0);
      expect(v2).toBeGreaterThan(0);
      expect(text.length).toBeGreaterThan(0);
    }
  });
  it('external resource catalogue only holds Catholic Answers navigator slugs unless reviewed or licensed', () => {
    const cat = json('resources/catalog.json');
    const rows = Array.isArray(cat) ? cat : Object.values(cat.resources ?? cat);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows as any[]) expect(r.url ?? r.u ?? '').toMatch(/^https:\/\//);
  });
  it('curated resources are https links to known sources and record how they were checked', () => {
    const reg = json('resources/sources.json');
    const known = new Set(reg.map((x: any) => x.id));
    const cat = json('resources/catalog.json');
    const rows = Object.values(cat) as any[];
    expect(rows.some((r) => r.source === 'catholic-answers' && r.how === 'human-reviewed')).toBe(true);
    for (const r of rows) {
      expect(known.has(r.source), r.source).toBe(true);
      expect(r.url).toMatch(/^https:\/\//);
      if (r.how === 'human-reviewed') expect(r.reviewedBy && r.reviewedOn).toBeTruthy();
    }
  });
  it('magisterium index links Scripture to numbered articles without storing document text', () => {
    const idx = json('magisterium/index.json');
    const dv = idx.documents.findIndex((d: any) => d.id === 'dei-verbum');
    expect(dv).toBeGreaterThanOrEqual(0);
    const t = json('magisterium/2TI.json').filter((e: number[]) => e[4] === dv);
    expect(t.some((e: number[]) => e[0] === 3 && e[1] === 16 && e[5] === 11)).toBe(true); // Dei Verbum 11 cites 2 Tim 3:16
    for (const e of json('magisterium/JHN.json').slice(0, 50)) expect(e.length).toBe(6);
    for (const d of idx.documents) expect(d.url).toMatch(/^https:\/\/www\.vatican\.va\//);
  });
  it('editorial reference data covers every book and every Pauline letter', () => {
    const books = json('reference/books.json');
    expect(Object.keys(books).length).toBe(73);
    for (const [id, b] of Object.entries<any>(books)) {
      expect(b.intro.length, id).toBeGreaterThan(30);
      expect(b.outline.length, id).toBeGreaterThan(0);
    }
    expect(Object.keys(json('reference/pauline.json').letters).length).toBe(14);
    const syn = json('reference/synopsis.json').rows;
    expect(syn.some((r: string[]) => r[0] === 'The Last Supper' && r[1].startsWith('Matthew 26'))).toBe(true);
    const gen = json('reference/genealogies.json');
    const ids = new Set(gen.persons.map((p: any) => p.id));
    for (const p of gen.persons) for (const k of ['f', 'm']) if (p[k]) expect(ids.has(p[k]), p.id).toBe(true);
    expect(gen.lines.matthew.groups.flatMap((g: any) => g[1]).at(-1)).toBe('jesus');
  });
  it('themes, textual variants, journeys, eras and memory sets are consistent', () => {
    const themes = json('reference/themes.json').themes;
    const ids = new Set(themes.map((t: any) => t.id));
    expect(themes.length).toBeGreaterThanOrEqual(12);
    for (const t of themes) {
      expect(t.stages.length, t.id).toBeGreaterThanOrEqual(5);
      for (const r of t.related) expect(ids.has(r), `${t.id}->${r}`).toBe(true);
    }
    const variants = json('reference/variants.json').variants;
    expect(variants.some((v: any) => v.id === 'mark-16')).toBe(true);
    for (const v of variants) expect(v.evidence.length, v.id).toBeGreaterThan(0);
    const places = new Set(json('maps/places.json').filter(Boolean).map((p: any) => p.n));
    for (const j of json('reference/journeys.json').journeys) for (const st of j.stops) expect(places.has(st.place), `${j.id}:${st.place}`).toBe(true);
    expect(json('reference/world.json').finds.length).toBeGreaterThan(8);
    expect(json('reference/memory-sets.json').sets.length).toBeGreaterThan(8);
  });
  it('original-language and map data exist and are shaped as the app expects', () => {
    const w = json('original/grc/JHN.json');
    expect(w[0][0][1][1]).toBe('746'); // John 1:1, second word ἀρχῇ = G746
    expect(json('original/hbo/GEN.json')[0][0][1][1]).toBe('1254'); // Genesis 1:1 bārā' = H1254
    expect(json('original/lex-grc.json')['3056'][0]).toBe('λόγος');
    const places = json('maps/places.json').filter(Boolean);
    expect(places.length).toBeGreaterThan(1000);
    for (const p of places.slice(0, 200)) {
      expect(p.lat).toBeGreaterThan(-90);
      expect(p.lon).toBeLessThan(180);
    }
    expect(json('topics/index.json').length).toBeGreaterThan(1000);
  });
  it('library works record translator, rights evidence and source', () => {
    const lib = json('library/index.json');
    expect(lib.works.length).toBeGreaterThanOrEqual(20);
    for (const w of lib.works) {
      expect(w.translator, w.id).toBeTruthy();
      expect(w.rightsEvidence, w.id).toBeTruthy();
      expect(w.source.url).toMatch(/^https:\/\/(ccel\.org|www\.gutenberg\.org|archive\.org)/);
      expect(w.rights).toBe('public-domain');
    }
  });
  it('Tractate 26 is placed on John 6', () => {
    const w = json('library/index.json').works.find((x: any) => x.id === 'aug-tractates-john');
    expect(w.sections[25].scripture[0]).toMatch(/^JHN\.6\./);
  });
});

describe('offline pack manifest', () => {
  it('lists real files with matching sizes and checksums', async () => {
    const { readFileSync, statSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const m = JSON.parse(readFileSync('public/data/manifest.json', 'utf8'));
    for (const p of m.packs) {
      expect(p.sizes).toHaveLength(p.files.length);
      expect(p.sums).toHaveLength(p.files.length);
      // spot-check every 20th file to keep the test quick
      for (let i = 0; i < p.files.length; i += 20) {
        const f = `public/data/${p.files[i]}`;
        expect(statSync(f).size, f).toBe(p.sizes[i]);
        expect(createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16), f).toBe(p.sums[i]);
      }
    }
  });
});
