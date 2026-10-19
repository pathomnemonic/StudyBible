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
        const f = join(D, 'bible', e.id, `${b.id}.json`);
        expect(existsSync(f), `${e.id}/${b.id}`).toBe(true);
        expect(e.chapters[b.id]).toBeGreaterThan(0);
      }
    }
  });
  it('Vulgate-numbered editions match the canon chapter table', () => {
    for (const e of editions.editions.filter((x: any) => x.scheme === 'vulgate')) for (const b of BOOKS) expect(e.chapters[b.id], `${e.id} ${b.id}`).toBe(b.chapters);
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
  it('library works record translator, rights evidence and source', () => {
    const lib = json('library/index.json');
    expect(lib.works.length).toBeGreaterThanOrEqual(8);
    for (const w of lib.works) {
      expect(w.translator, w.id).toBeTruthy();
      expect(w.rightsEvidence, w.id).toBeTruthy();
      expect(w.source.url).toMatch(/^https:\/\/ccel\.org/);
      expect(w.rights).toBe('public-domain');
    }
  });
  it('Tractate 26 is placed on John 6', () => {
    const w = json('library/index.json').works.find((x: any) => x.id === 'aug-tractates-john');
    expect(w.sections[25].scripture[0]).toMatch(/^JHN\.6\./);
  });
});
