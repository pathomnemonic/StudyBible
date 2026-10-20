import { plainNumerals } from '../../src/lib/readable';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { PUBLIC_DATA, RAW, readJson, REGISTRY, Report, today, writeJson, exists } from './lib/util';
import { BOOK_BY_ID } from '../../src/lib/canon';
import { decodeEntities, parseOsis, plain, scripRefs } from './lib/thml';
import { niceCase, parsePlainText, type TextSource } from './plaintext';

interface WorkCfg {
  id: string;
  /** CCEL volume (ThML). Works not on CCEL give `text` instead. */
  ccel?: string;
  /** Plain-text source (Project Gutenberg / Internet Archive), see plaintext.ts. */
  text?: TextSource;
  title: string;
  author: string;
  authorId: string;
  period: string;
  authority: string;
  kind: string;
  year?: string;
  rootTitle?: string | null;
  /** Pick one div2 (e.g. one epistle) inside a shared volume section. */
  subTitle?: string;
  scriptureMode: 'tractates' | 'psalm-roman' | 'john-dot' | 'homily-start' | 'summa-index' | 'tags';
  book?: string;
  indexOnly?: boolean;
  sectionUrl?: string;
  psalmTags?: 'vulgate' | 'english' | 'skip';
  sectionLabel?: string;
  skipTitles?: string[];
  /** split a work made of numbered paragraphs ("12. …") into sections of this many numbers */
  splitEvery?: number;
  /** Prefix each section title with its volume/book title (up to the first full stop), for works whose chapters repeat across books. */
  prefixParent?: boolean;
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

export function sectionsOf(xml: string, cfg: WorkCfg): { title: string; id: string; body: string }[] {
  // Choose the div1 root(s)
  const div1s = [...xml.matchAll(/<div1\b([^>]*)>([\s\S]*?)(?=<div1\b|<\/ThML\.body>)/g)].map((m) => ({
    attrs: m[1],
    body: m[2],
    title: decodeEntities(/\stitle="([^"]*)"/.exec(m[1])?.[1] ?? ''),
    id: /\bid="([^"]*)"/.exec(m[1])?.[1] ?? '',
  }));
  const skip = (t: string) => (cfg.skipTitles ?? ['Title Page', 'Preface', 'Index']).some((s) => t.toLowerCase().startsWith(s.toLowerCase()));
  const roots = cfg.rootTitle ? div1s.filter((d) => d.title.includes(cfg.rootTitle!) || new RegExp(cfg.rootTitle!, 'i').test(d.title)) : div1s.filter((d) => !skip(d.title));
  const out: { title: string; id: string; body: string }[] = [];
  const finer = (items: { title: string; id: string; body: string }[]) => {
    // Works delivered as a few giant sections are split at the next level down so they can be read and linked sensibly.
    if (items.length >= 10) return items;
    const res: { title: string; id: string; body: string }[] = [];
    for (const it of items) {
      const kids = [...it.body.matchAll(/<div3\b([^>]*)>([\s\S]*?)(?=<div3\b|$)/g)];
      if (kids.length < 2) {
        res.push(it);
        continue;
      }
      for (const k of kids) {
        const t = decodeEntities(/\stitle="([^"]*)"/.exec(k[1])?.[1] ?? '');
        if (skip(t)) continue;
        res.push({ title: `${it.title} — ${t}`, id: /\bid="([^"]*)"/.exec(k[1])?.[1] ?? '', body: k[2] });
      }
    }
    return res;
  };
  for (const r of roots) {
    const div2s = [...r.body.matchAll(/<div2\b([^>]*)>([\s\S]*?)(?=<div2\b|$)/g)];
    if (!div2s.length) {
      out.push({ title: r.title, id: r.id, body: r.body });
      continue;
    }
    for (const d of div2s) {
      const title = decodeEntities(/\stitle="([^"]*)"/.exec(d[1])?.[1] ?? '');
      if (skip(title)) continue;
      if (cfg.subTitle && !new RegExp(cfg.subTitle, 'i').test(title)) continue;
      const parent = niceCase(r.title.replace(/\s+/g, ' ').trim().split(/\.\s/)[0].replace(/\.$/, ''));
      out.push({ title: cfg.prefixParent ? `${parent} — ${title}` : title, id: /\bid="([^"]*)"/.exec(d[1])?.[1] ?? '', body: d[2] });
    }
  }
  const base = finer(out);
  if (!cfg.splitEvery) return base;
  const res: { title: string; id: string; body: string }[] = [];
  for (const sec of base) {
    const marks: { at: number; n: number }[] = [];
    for (const m of sec.body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
      const n = /^\s*(\d{1,3})\.\s/.exec(plain(m[1]))?.[1];
      if (n) marks.push({ at: m.index!, n: +n });
    }
    if (marks.length < 2) { res.push(sec); continue; }
    const cuts: { at: number; n: number }[] = [];
    let next = 1;
    for (const mk of marks) if (mk.n >= next) { cuts.push(mk); next = Math.floor((mk.n - 1) / cfg.splitEvery) * cfg.splitEvery + cfg.splitEvery + 1; }
    cuts.forEach((c, i) => {
      const end = i + 1 < cuts.length ? cuts[i + 1].at : sec.body.length;
      const lastN = i + 1 < cuts.length ? cuts[i + 1].n - 1 : marks[marks.length - 1].n;
      res.push({ title: `${sec.title} — §§${c.n}–${lastN}`, id: `${sec.id}-${c.n}`, body: sec.body.slice(i === 0 ? 0 : c.at, end) });
    });
  }
  return res;
}

interface TagHit {
  ref: Ref;
  snippet: string;
  pi: number;
}

/** The first two paragraphs that carry prose, skipping the homily heading and the Scripture line printed under it. */
function leadText(paras: string[]): string {
  const body = paras.filter((p) => p.replace(/\[[^\]]*\]/g, '').trim().length >= 80);
  return (body.length ? body : paras).slice(0, 2).join('\n\n').slice(0, 700);
}

export function buildLibrary(report: Report) {
  const cfgs: WorkCfg[] = readJson(join(REGISTRY, 'library.json')).works;
  const meta: any[] = [];
  const scriptureIndex = new Map<string, any[]>(); // book → entries
  const postings = new Map<string, number[]>();
  const sectionIndex: [string, number][] = []; // global section idx → [workId, sectionIdx]
  let globalIdx = 0;

  const vc: Record<string, number[]> = readJson(join(PUBLIC_DATA, 'editions.json')).editions.find((e: any) => e.id === 'vulgate').verseCounts;
  const pushScripture = (book: string, entry: any[]) => (scriptureIndex.get(book) ?? scriptureIndex.set(book, []).get(book)!).push(entry);

  const registerTextWork = (cfg: WorkCfg, rawText: string) => {
    const src = cfg.text!;
    const sections: Section[] = parsePlainText(rawText, src).map((s) => ({ ...s, scripture: [] }));
    sections.forEach((sec, idx) => {
      sectionIndex.push([cfg.id, idx]);
      for (const w of new Set(tokenize(sec.title + ' ' + sec.paras.join(' ')))) (postings.get(w) ?? postings.set(w, []).get(w)!).push(globalIdx);
      globalIdx++;
    });
    writeJson(join(PUBLIC_DATA, 'library/works', `${cfg.id}.json`), { id: cfg.id, sections });
    meta.push({
      id: cfg.id, title: cfg.title, author: cfg.author, authorId: cfg.authorId, period: cfg.period, authority: cfg.authority, kind: cfg.kind, year: cfg.year,
      description: cfg.description, scriptureMode: cfg.scriptureMode,
      translator: (cfg as any).translator, rightsEvidence: (cfg as any).rightsEvidence,
      source: { name: src.sourceName, url: src.sourceUrl, retrieved: today() },
      rights: 'public-domain', format: 'full-text',
      sections: sections.map((s) => ({ id: s.id, title: s.title, scripture: [], words: s.paras.reduce((a, p) => a + p.split(' ').length, 0) })),
    });
    report.stats[`library.${cfg.id}`] = { sections: sections.length };
    if (!sections.length) report.warn(`library: ${cfg.id} produced no sections`);
  };

  for (const cfg of cfgs) {
    if (cfg.text) {
      const tp = join(RAW, cfg.text.file);
      if (exists(tp)) registerTextWork(cfg, readFileSync(tp, 'utf8'));
      else report.warn(`library: ${cfg.id} not fetched`);
      continue;
    }
    const path = join(RAW, `ccel_${cfg.ccel!.replace('/', '_')}.xml`);
    if (!exists(path)) {
      report.warn(`library: ${cfg.id} not fetched`);
      continue;
    }
    const xml = readFileSync(path, 'utf8');
    if (cfg.scriptureMode === 'summa-index') {
      buildSummaIndex(cfg, xml, meta, pushScripture, report);
      continue;
    }
    const published = decodeEntities(/<published>([^<]*)<\/published>/.exec(xml)?.[1] ?? '');
    const secs = sectionsOf(xml, cfg);
    const sections: Section[] = [];
    let ordinal = 0;
    let lastJohn: { c: number; v: number }[] = [];
    const startHints: ({ c: number; v: number } | null)[] = [];

    for (const s of secs) {
      const paras: string[] = [];
      const hits: TagHit[] = [];
      let prevPara = '';
      for (const pm of s.body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
        const raw = pm[1];
        const t = plain(raw);
        if (t.length < 2) continue;
        const context = t.length < 160 && prevPara ? `${prevPara.slice(-320)} ${t}` : t;
        prevPara = t;
        paras.push(t);
        // a paragraph that is only a string of references (a translator's footnote such as "Wisd. ix. 17–19.") says nothing about the verse
        const prose = plain(raw.replace(/<scripRef[\s\S]*?<\/scripRef>/g, '')).replace(/[^A-Za-z]/g, '');
        if (prose.length < 45) continue;
        for (const r of scripRefs(raw)) {
          const p = parseOsis(r.osis);
          if (!p || p.v1 === undefined) continue;
          if (p.book === 'PSA' && !r.vulgate) {
            if (cfg.psalmTags === 'skip' || !cfg.psalmTags) continue;
          }
          const scheme = r.vulgate || (p.book === 'PSA' && cfg.psalmTags === 'vulgate') ? 'vulgate' : 'kjv';
          const a = scheme === 'vulgate' ? { c: p.c1, v1: p.v1, v2: p.v1 } : toAnchor('kjv', p.book, p.c1, p.v1);
          const b = p.v2 !== undefined && p.c2 === p.c1 ? (scheme === 'vulgate' ? { c: p.c1, v1: p.v2, v2: p.v2 } : toAnchor('kjv', p.book, p.c1, p.v2)) : a;
          hits.push({ ref: { book: p.book, c1: a.c, v1: a.v1, c2: a.c, v2: Math.max(b.v2, a.v1) }, snippet: context.slice(0, 700), pi: paras.length - 1 });
        }
      }
      if (!paras.length) continue;
      const idx = sections.length;
      let title = plainNumerals(s.title.trim().replace(/\.$/, ''), { title: true });
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
      if (cfg.scriptureMode === 'homily-start') {
        const tm = /—\s*(?:[1-3]\s*)?[A-Za-z]+\s+(\d+)[:.](\d+)/.exec(s.title) ?? /\bon\s+(?:[1-3]\s*)?(?:Acts|Rom\.?|Cor\.?|Heb\.?|John)\s+([ivxlc]+)\.\s*(\d+)/i.exec(s.title) ?? /^John\s+(\d+)\.(\d+)/.exec(s.title);
        let hint: { c: number; v: number } | null = null;
        if (tm) hint = /^\d/.test(tm[1]) ? { c: +tm[1], v: +tm[2] } : { c: roman(tm[1]), v: +tm[2] };
        else {
          const h = hits.slice(0, 40).find((x) => x.ref.book === cfg.book);
          if (h) hint = { c: h.ref.c1, v: h.ref.v1 ?? 1 };
        }
        startHints.push(hint);
        title = `${cfg.sectionLabel ?? 'Section'} ${startHints.length}${hint ? ` (${BOOK_BY_ID[cfg.book!].name} ${hint.c}:${hint.v}…)` : ''}`;
      }
      sections.push({ id: s.id, title, paras, scripture: structure.map(refId) });
      for (const r of structure) pushScripture(r.book, [r.c1, r.v1 ?? 0, r.c2, r.v2 ?? 0, cfg.id, idx, 's', '']);
      // one entry per cited passage in a section: the paragraph that says the most about it
      const best = new Map<string, TagHit>();
      for (const h of hits) {
        const k = refId(h.ref);
        const cur = best.get(k);
        if (!cur || h.snippet.length > cur.snippet.length) best.set(k, h);
      }
      for (const h of best.values()) pushScripture(h.ref.book, [h.ref.c1, h.ref.v1 ?? 0, h.ref.c2, h.ref.v2 ?? 0, cfg.id, idx, 't', h.snippet, h.pi]);
      // full-text postings (section level)
      sectionIndex.push([cfg.id, idx]);
      const words = new Set(tokenize(title + ' ' + paras.join(' ')));
      for (const w of words) (postings.get(w) ?? postings.set(w, []).get(w)!).push(globalIdx);
      globalIdx++;
    }

    // Homily series: each homily's verse span runs from its start verse to just before the next homily's start.
    if (cfg.scriptureMode === 'homily-start') {
      const chEnd = (c: number) => vc[cfg.book!]?.[c - 1] ?? 999;
      sections.forEach((sec, i) => {
        const st = startHints[i];
        if (!st) return;
        const nx = startHints.slice(i + 1).find((x) => x && (x.c > st.c || (x.c === st.c && x.v > st.v)));
        let r: Ref;
        if (!nx) r = { book: cfg.book!, c1: st.c, v1: st.v, c2: st.c, v2: chEnd(st.c) };
        else if (nx.c === st.c) r = { book: cfg.book!, c1: st.c, v1: st.v, c2: st.c, v2: nx.v - 1 };
        else if (nx.v > 1) r = { book: cfg.book!, c1: st.c, v1: st.v, c2: nx.c, v2: nx.v - 1 };
        else r = { book: cfg.book!, c1: st.c, v1: st.v, c2: nx.c - 1, v2: chEnd(nx.c - 1) };
        sec.scripture = [refId(r)];
        pushScripture(cfg.book!, [r.c1, r.v1!, r.c2, r.v2!, cfg.id, i, 's', leadText(sec.paras), 0]);
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


/** Index-only treatment of a very large work: store which articles cite which verses (with a short snippet) and link out for the text. */
function buildSummaIndex(cfg: WorkCfg, xml: string, meta: any[], push: (book: string, entry: any[]) => void, report: Report) {
  const articles = [...xml.matchAll(/<div4\b([^>]*)>([\s\S]*?)(?=<div4\b|<div3\b|<div2\b|<div1\b|<\/ThML\.body>)/g)];
  const sections: { id: string; title: string; scripture: string[]; words: number }[] = [];
  let cites = 0;
  const byQuestion = new Map<string, Record<string, { title: string; paras: string[] }>>();
  for (const a of articles) {
    const id = /\bid="([^"]*)"/.exec(a[1])?.[1];
    const title = decodeEntities(/\stitle="([^"]*)"/.exec(a[1])?.[1] ?? '');
    if (!id || !/^(FP|FS|SS|TP|XP)_Q\d+_A\d+$/.test(id)) continue;
    const idx = sections.length;
    sections.push({ id, title: title.replace(/^Article\.\s*/, ''), scripture: [], words: 0 });
    const seen = new Set<string>();
    const paras: string[] = [];
    for (const pm of a[2].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
      const raw = pm[1];
      const t = plain(raw);
      if (t.length < 2) continue;
      paras.push(t);
      const pi = paras.length - 1;
      if (!raw.includes('<scripRef')) continue;
      for (const r of scripRefs(raw)) {
        const p = parseOsis(r.osis);
        if (!p || p.v1 === undefined) continue;
        // The Summa's tags carry osisRef="Bible.vul:…": Vulgate numbering, i.e. the anchor itself (Psalms included).
        const conv = (v: number) => (r.vulgate ? { c: p.c1, v1: v, v2: v } : toAnchor('kjv', p.book, p.c1, v));
        const x = conv(p.v1);
        const y = p.v2 !== undefined && p.c2 === p.c1 ? conv(p.v2) : x;
        const key = `${p.book}.${x.c}.${x.v1}`;
        if (seen.has(key)) continue;
        seen.add(key);
        push(p.book, [x.c, x.v1, x.c, Math.max(y.v2, x.v1), cfg.id, idx, 't', t.slice(0, 700), pi]);
        cites++;
      }
    }
    const qid = id.replace(/_A\d+$/, '');
    (byQuestion.get(qid) ?? byQuestion.set(qid, {}).get(qid)!)[id] = { title: title.replace(/^Article\.\s*/, ''), paras };
  }
  // the full text of every article, by question, so a citation can be read in its argument (loaded on demand)
  for (const [q, arts] of byQuestion) writeJson(join(PUBLIC_DATA, 'library/summa', `${q}.json`), arts);
  meta.push({
    id: cfg.id, title: cfg.title, author: cfg.author, authorId: cfg.authorId, period: cfg.period, authority: cfg.authority, kind: cfg.kind, year: cfg.year,
    description: cfg.description, scriptureMode: cfg.scriptureMode, translator: (cfg as any).translator, rightsEvidence: (cfg as any).rightsEvidence,
    source: { name: 'Christian Classics Ethereal Library (CCEL)', url: `https://ccel.org/ccel/${cfg.ccel}`, retrieved: today() },
    rights: 'public-domain', format: 'excerpt', indexOnly: true, sectionUrl: cfg.sectionUrl, sections,
  });
  report.stats[`library.${cfg.id}`] = { articles: sections.length, citations: cites };
}
