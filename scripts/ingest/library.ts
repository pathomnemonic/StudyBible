import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { PUBLIC_DATA, RAW, readJson, REGISTRY, Report, today, writeJson, exists } from './lib/util';
import { decodeEntities, parseOsis, plain, scripRefs } from './lib/thml';

interface WorkCfg {
  id: string;
  ccel: string;
  title: string;
  author: string;
  authorId: string;
  period: string;
  authority: string;
  kind: string;
  year?: string;
  rootTitle?: string | null;
  scriptureMode: 'tractates' | 'psalm-roman' | 'john-dot' | 'tags';
  psalmTags?: 'vulgate' | 'english' | 'skip';
  sectionLabel?: string;
  skipTitles?: string[];
  description: string;
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
export function roman(s: string): number {
  let n = 0;
  const u = s.toUpperCase();
  for (let i = 0; i < u.length; i++) {
    const v = ROMAN[u[i]] ?? 0;
    const nx = ROMAN[u[i + 1]] ?? 0;
    n += v < nx ? -v : v;
  }
  return n;
}

const STOP = new Set('about above after again against also among because been before being between both cannot could does doing done down during each either else even ever every from further have having here hers herself himself into itself just least less made make many might more most much must never none nothing once only other ours ourselves over same shall should since some such than that their theirs them themselves then there these they this those through thus unto until upon very what when where whether which while whom whose will with within without would your yours yourself yourselves hath thee thou thy thine doth shalt wilt art unto therefore however'.split(' '));

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4 && w.length <= 20 && !STOP.has(w));
}

interface Section {
  id: string;
  title: string;
  paras: string[];
  scripture: string[]; // structure-derived anchor ids
}

/** Parse "Chapter II. 23–25; III. 1–5." style titles (Augustine's Tractates). */
function parseTractateTitle(title: string): Ref[] {
  const out: Ref[] = [];
  let ch = 0;
  for (const seg of title.replace(/^Chapter\s+/i, '').replace(/\.$/, '').split(';')) {
    const m = /^\s*(?:([IVXLC]+)\.\s*)?(.*)$/.exec(seg.trim());
    if (!m) continue;
    if (m[1]) ch = roman(m[1]);
    if (!ch) continue;
    const nums = (m[2].match(/\d+/g) ?? []).map(Number);
    if (!nums.length) out.push({ book: 'JHN', c1: ch, c2: ch });
    else out.push({ book: 'JHN', c1: ch, v1: Math.min(...nums), c2: ch, v2: Math.max(...nums) });
  }
  return out;
}

function sectionsOf(xml: string, cfg: WorkCfg): { title: string; id: string; body: string }[] {
  // Choose the div1 root(s)
  const div1s = [...xml.matchAll(/<div1\b([^>]*)>([\s\S]*?)(?=<div1\b|<\/ThML\.body>)/g)].map((m) => ({
    attrs: m[1],
    body: m[2],
    title: decodeEntities(/title="([^"]*)"/.exec(m[1])?.[1] ?? ''),
    id: /\bid="([^"]*)"/.exec(m[1])?.[1] ?? '',
  }));
  const skip = (t: string) => (cfg.skipTitles ?? ['Title Page', 'Preface', 'Index']).some((s) => t.toLowerCase().startsWith(s.toLowerCase()));
  const roots = cfg.rootTitle ? div1s.filter((d) => d.title.includes(cfg.rootTitle!) || new RegExp(cfg.rootTitle!, 'i').test(d.title)) : div1s.filter((d) => !skip(d.title));
  const out: { title: string; id: string; body: string }[] = [];
  for (const r of roots) {
    const div2s = [...r.body.matchAll(/<div2\b([^>]*)>([\s\S]*?)(?=<div2\b|$)/g)];
    if (!div2s.length) {
      out.push({ title: r.title, id: r.id, body: r.body });
      continue;
    }
    for (const d of div2s) {
      const title = decodeEntities(/title="([^"]*)"/.exec(d[1])?.[1] ?? '');
      if (skip(title)) continue;
      out.push({ title, id: /\bid="([^"]*)"/.exec(d[1])?.[1] ?? '', body: d[2] });
    }
  }
  return out;
}

interface TagHit {
  ref: Ref;
  snippet: string;
}

export function buildLibrary(report: Report) {
  const cfgs: WorkCfg[] = readJson(join(REGISTRY, 'library.json')).works;
  const meta: any[] = [];
  const scriptureIndex = new Map<string, any[]>(); // book → entries
  const postings = new Map<string, number[]>();
  const sectionIndex: [string, number][] = []; // global section idx → [workId, sectionIdx]
  let globalIdx = 0;

  const pushScripture = (book: string, entry: any[]) => (scriptureIndex.get(book) ?? scriptureIndex.set(book, []).get(book)!).push(entry);

  for (const cfg of cfgs) {
    const path = join(RAW, `ccel-${cfg.id}.xml`);
    if (!exists(path)) {
      report.warn(`library: ${cfg.id} not fetched`);
      continue;
    }
    const xml = readFileSync(path, 'utf8');
    const published = decodeEntities(/<published>([^<]*)<\/published>/.exec(xml)?.[1] ?? '');
    const secs = sectionsOf(xml, cfg);
    const sections: Section[] = [];
    let ordinal = 0;
    let lastJohn: { c: number; v: number }[] = [];

    for (const s of secs) {
      const paras: string[] = [];
      const hits: TagHit[] = [];
      for (const pm of s.body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
        const raw = pm[1];
        const t = plain(raw);
        if (t.length < 2) continue;
        paras.push(t);
        for (const r of scripRefs(raw)) {
          const p = parseOsis(r.osis);
          if (!p || p.v1 === undefined) continue;
          if (p.book === 'PSA') {
            if (cfg.psalmTags === 'skip' || !cfg.psalmTags) continue;
          }
          const scheme = p.book === 'PSA' && cfg.psalmTags === 'vulgate' ? 'vulgate' : 'english';
          const a = scheme === 'vulgate' ? { c: p.c1, v1: p.v1, v2: p.v1 } : toAnchor('english', p.book, p.c1, p.v1);
          const b = p.v2 !== undefined && p.c2 === p.c1 ? (scheme === 'vulgate' ? { c: p.c1, v1: p.v2, v2: p.v2 } : toAnchor('english', p.book, p.c1, p.v2)) : a;
          hits.push({ ref: { book: p.book, c1: a.c, v1: a.v1, c2: a.c, v2: Math.max(b.v2, a.v1) }, snippet: t.slice(0, 280) });
        }
      }
      if (!paras.length) continue;
      const idx = sections.length;
      let title = s.title.replace(/\.$/, '');
      const structure: Ref[] = [];
      ordinal++;
      if (cfg.scriptureMode === 'tractates' && /^Chapter/i.test(s.title)) {
        structure.push(...parseTractateTitle(s.title));
        title = `${cfg.sectionLabel ?? 'Section'} ${ordinal} (${s.title.replace(/\.$/, '').replace(/^Chapter\s+/i, 'John ')})`;
      } else if (cfg.scriptureMode === 'psalm-roman') {
        const m = /^Psalm\s+([IVXLC]+)\b/i.exec(s.title);
        if (m) structure.push({ book: 'PSA', c1: roman(m[1]), c2: roman(m[1]) });
      } else if (cfg.scriptureMode === 'john-dot') {
        const m = /^John\s+(\d+)\.(\d+)/.exec(s.title);
        if (m) {
          lastJohn.push({ c: +m[1], v: +m[2] });
          title = `${cfg.sectionLabel ?? 'Section'} ${lastJohn.length}: ${s.title}`;
        }
      }
      sections.push({ id: s.id, title, paras, scripture: structure.map(refId) });
      for (const r of structure) pushScripture(r.book, [r.c1, r.v1 ?? 0, r.c2, r.v2 ?? 0, cfg.id, idx, 's', '']);
      const seen = new Set<string>();
      for (const h of hits) {
        const k = refId(h.ref);
        if (seen.has(k)) continue;
        seen.add(k);
        pushScripture(h.ref.book, [h.ref.c1, h.ref.v1 ?? 0, h.ref.c2, h.ref.v2 ?? 0, cfg.id, idx, 't', h.snippet]);
      }
      // full-text postings (section level)
      sectionIndex.push([cfg.id, idx]);
      const words = new Set(tokenize(title + ' ' + paras.join(' ')));
      for (const w of words) (postings.get(w) ?? postings.set(w, []).get(w)!).push(globalIdx);
      globalIdx++;
    }

    // Chrysostom-on-John: derive each homily's verse span from successive start points.
    if (cfg.scriptureMode === 'john-dot') {
      // sections came with a start verse in their titles; compute spans now
      const starts = sections.map((s) => /John (\d+)\.(\d+)/.exec(s.title)).map((m) => (m ? { c: +m[1], v: +m[2] } : null));
      sections.forEach((s, i) => {
        const st = starts[i];
        if (!st) return;
        const nx = starts.slice(i + 1).find(Boolean);
        let r: Ref;
        if (nx && nx.c === st.c) r = { book: 'JHN', c1: st.c, v1: st.v, c2: st.c, v2: Math.max(st.v, nx.v - (nx.v > st.v ? 1 : 0)) };
        else if (nx && nx.c > st.c) r = { book: 'JHN', c1: st.c, v1: st.v, c2: st.c, v2: 999 };
        else r = { book: 'JHN', c1: st.c, v1: st.v, c2: st.c, v2: 999 };
        s.scripture = [refId(r)];
        pushScripture('JHN', [r.c1, r.v1!, r.c2, r.v2!, cfg.id, i, 's', '']);
      });
    }

    writeJson(join(PUBLIC_DATA, 'library/works', `${cfg.id}.json`), { id: cfg.id, sections });
    meta.push({
      id: cfg.id,
      title: cfg.title,
      author: cfg.author,
      authorId: cfg.authorId,
      period: cfg.period,
      authority: cfg.authority,
      kind: cfg.kind,
      year: cfg.year,
      description: cfg.description,
      scriptureMode: cfg.scriptureMode,
      translator: (cfg as any).translator, rightsEvidence: (cfg as any).rightsEvidence,
      printSource: published,
      source: { name: 'Christian Classics Ethereal Library (CCEL)', url: `https://ccel.org/ccel/${cfg.ccel}`, retrieved: today() },
      rights: 'public-domain',
      format: 'full-text',
      sections: sections.map((s) => ({ id: s.id, title: s.title, scripture: s.scripture, words: s.paras.reduce((a, p) => a + p.split(' ').length, 0) })),
    });
    report.stats[`library.${cfg.id}`] = { sections: sections.length };
    if (!sections.length) report.warn(`library: ${cfg.id} produced no sections`);
  }

  writeJson(join(PUBLIC_DATA, 'library/index.json'), { generated: today(), works: meta });
  for (const [book, entries] of scriptureIndex) writeJson(join(PUBLIC_DATA, 'library/scripture', `${book}.json`), entries);
  // section-level full-text postings (words ≥4 letters, stop-words removed)
  const post: Record<string, number[]> = {};
  for (const [w, ids] of postings) if (ids.length < globalIdx * 0.6) post[w] = ids;
  writeJson(join(PUBLIC_DATA, 'library/fulltext-index.json'), { sections: sectionIndex, postings: post });
  report.stats['library.total'] = { works: meta.length, sections: globalIdx, indexedWords: Object.keys(post).length };
}
