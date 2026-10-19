import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS } from '../../src/lib/canon';
import { lookupBook, parseRefs, refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { CURATED, ROOT, PUBLIC_DATA, readText, readJson, Report, today, writeJson, exists } from './lib/util';

/**
 * External Catholic resources (articles, Q&As, videos, podcast episodes) attached to passages.
 *
 * Sources of rows, in order of trust:
 *   1. data/curated/external-resources.json — links a person has individually read and mapped.
 *   2. data/licensed/*.jsonl — datasets supplied by a publisher under an agreement (git-ignored, never committed).
 *   3. The Catholic Answers Bible Navigator URL list — the publisher's own *sitemap* entries, whose slugs name a topic and a passage.
 *
 * Nothing here fetches or stores publisher pages. Publishers whose terms forbid automated collection (e.g. Catholic Answers) are
 * covered only by (1)–(3).
 */

export interface ExternalRow {
  id: string;
  source: string; // sources.json id
  type: 'article' | 'qa' | 'tract' | 'video' | 'podcast' | 'homily' | 'page' | 'navigator';
  title: string;
  url: string;
  author?: string;
  date?: string;
  refs: string[]; // anchor ids
  how: 'publisher-supplied' | 'human-reviewed' | 'url-slug';
  note?: string; // our own words, short
  tags?: string[];
  show?: string; // podcast / programme name
  basis?: 'page-read' | 'title-and-summary'; // how the match was checked
  reviewedBy?: string;
  reviewedOn?: string;
}

const SLUG_BOOK: Record<string, string> = {
  matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT', romans: 'ROM', '1corinthians': '1CO', '2corinthians': '2CO', galatians: 'GAL', ephesians: 'EPH',
  philippians: 'PHP', phil: 'PHP', colossians: 'COL', '1thessalonians': '1TH', '2thessalonians': '2TH', '1timothy': '1TI', '2timothy': '2TI', titus: 'TIT', philemon: 'PHM',
  hebrews: 'HEB', james: 'JAS', '1peter': '1PE', '2peter': '2PE', '1john': '1JN', '2john': '2JN', '3john': '3JN', jude: 'JUD', revelation: 'REV', genesis: 'GEN', exodus: 'EXO',
  leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU', joshua: 'JOS', judges: 'JDG', ruth: 'RUT', '1samuel': '1SA', '2samuel': '2SA', '1kings': '1KI', '2kings': '2KI',
  '1chronicles': '1CH', '2chronicles': '2CH', ezra: 'EZR', nehemiah: 'NEH', tobit: 'TOB', judith: 'JDT', esther: 'EST', '1maccabees': '1MA', '2maccabees': '2MA', job: 'JOB',
  psalm: 'PSA', psalms: 'PSA', proverbs: 'PRO', ecclesiastes: 'ECC', wisdom: 'WIS', sirach: 'SIR', isaiah: 'ISA', jeremiah: 'JER', lamentations: 'LAM', baruch: 'BAR',
  ezekiel: 'EZK', daniel: 'DAN', hosea: 'HOS', joel: 'JOL', amos: 'AMO', obadiah: 'OBA', jonah: 'JON', micah: 'MIC', nahum: 'NAM', habakkuk: 'HAB', zephaniah: 'ZEP',
  haggai: 'HAG', zechariah: 'ZEC', malachi: 'MAL', sirach_: 'SIR',
};

/** "john175" → John 17:5 ; "luke139-44" → Luke 1:39-44 ; "revelation42,6,8" → Rev 4:2,6,8. Returns null when the slug is ambiguous or out of bounds. */
export function parseSlugRef(slug: string, chapters: Record<string, number[]>): Ref[] | null {
  const m = /^((?:[1-3])?[a-z]+)\.?(\d[\d,\-]*)$/.exec(slug.toLowerCase().replace(/[\u2013\u2014]/g, '-'));
  if (!m) return null;
  const book = SLUG_BOOK[m[1]];
  if (!book) return null;
  const digits = m[2];
  const vc = chapters[book];
  if (!vc) return null;
  const [first, ...restParts] = digits.split(',');
  const dash = first.split('-');
  const startDigits = dash[0];
  const endVerse = dash[1] ? +dash[1] : undefined;
  const cands: { c: number; v: number }[] = [];
  for (let i = 1; i < startDigits.length; i++) {
    const c = +startDigits.slice(0, i);
    const v = +startDigits.slice(i);
    if (startDigits.slice(i)[0] === '0') continue;
    if (c >= 1 && c <= vc.length && v >= 1 && v <= vc[c - 1] + 2 && (endVerse === undefined || (endVerse >= v && endVerse <= vc[c - 1] + 2))) cands.push({ c, v });
  }
  if (vc.length === 1 && cands.length === 0) {
    const v = +startDigits;
    if (v >= 1 && v <= vc[0]) cands.push({ c: 1, v });
  }
  if (cands.length !== 1) return null; // none or ambiguous
  const { c, v } = cands[0];
  const out: Ref[] = [{ book, c1: c, v1: v, c2: c, v2: endVerse ?? v }];
  for (const r of restParts) if (/^\d+$/.test(r)) out.push({ book, c1: c, v1: +r, c2: c, v2: +r });
  return out;
}

const pretty = (slug: string) => slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function buildExternal(report: Report) {
  const eds = readJson(join(PUBLIC_DATA, 'editions.json')).editions;
  const vc: Record<string, number[]> = eds.find((e: any) => e.id === 'vulgate').verseCounts;
  const rows: ExternalRow[] = [];
  const toAnchorIds = (refs: Ref[]) =>
    refs.map((r) => {
      const a = toAnchor('kjv', r.book, r.c1, r.v1 ?? 1);
      const b = r.v2 !== undefined ? toAnchor('kjv', r.book, r.c2, r.v2) : a;
      return refId({ book: r.book, c1: a.c, v1: a.v1, c2: b.c, v2: Math.max(b.v2, a.v1) });
    });

  const regPath = join(ROOT, 'data/registry/resource-sources.json');
  const registry = readJson(regPath).sources as any[];
  const knownSources = new Set(registry.map((x) => x.id));
  // 1. curated
  const curPath = join(CURATED, 'external-resources.json');
  if (exists(curPath)) {
    for (const r of readJson(curPath).resources as any[]) {
      if (!r.reviewedBy || !r.reviewedOn) {
        report.error(`external: curated resource "${r.title}" lacks reviewedBy/reviewedOn`);
        continue;
      }
      if (!knownSources.has(r.source)) report.error(`external: "${r.title}": unknown source "${r.source}" (add it to data/registry/resource-sources.json)`);
      if (!/^https:\/\//.test(r.url ?? '')) report.error(`external: "${r.title}": url must be https`);
      const refs: Ref[] = [];
      for (const s of r.refs as string[]) {
        const p = parseRefs(s);
        if (!p.ok) {
          report.error(`external: "${r.title}": bad ref "${s}"`);
          continue;
        }
        refs.push(...p.refs.map((x) => x.ref));
      }
      rows.push({ id: `cur-${rows.length}`, source: r.source, type: r.type, title: r.title, url: r.url, author: r.author, date: r.date, refs: toAnchorIds(refs), how: 'human-reviewed', note: r.note, tags: r.tags, show: r.show, basis: r.basis ?? 'page-read', reviewedBy: r.reviewedBy, reviewedOn: r.reviewedOn });
    }
  }
  // 2. licensed / publisher-supplied datasets
  const licDir = join(ROOT, 'data/licensed');
  if (exists(licDir)) {
    for (const f of readdirSync(licDir).filter((x) => x.startsWith('external-') && x.endsWith('.jsonl'))) {
      for (const [i, line] of readText(join(licDir, f)).split('\n').entries()) {
        if (!line.trim()) continue;
        try {
          const r = JSON.parse(line);
          const refs: Ref[] = [];
          for (const s of r.refs as string[]) {
            const p = parseRefs(s);
            if (p.ok) refs.push(...p.refs.map((x) => x.ref));
          }
          if (!r.url || !r.title || !refs.length) throw new Error('needs url, title and at least one valid ref');
          rows.push({ id: `lic-${f}-${i}`, source: r.source, type: r.type ?? 'article', title: r.title, url: r.url, author: r.author, date: r.date, refs: toAnchorIds(refs), how: 'publisher-supplied', note: r.note });
        } catch (e: any) {
          report.warn(`external: ${f}:${i + 1}: ${e.message}`);
        }
      }
    }
  }
  // 3. Catholic Answers Bible Navigator (sitemap URLs)
  const navPath = join(CURATED, 'ca-bible-navigator-urls.txt');
  let navOk = 0;
  let navSkipped = 0;
  if (exists(navPath)) {
    for (const url of readText(navPath).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
      const m = /\/bible-navigator\/([^/]+)\/([^/]+)$/.exec(url);
      if (!m) continue; // topic landing pages have no passage in the slug
      const refs = parseSlugRef(decodeURIComponent(m[2]), vc);
      if (!refs) {
        navSkipped++;
        continue;
      }
      rows.push({ id: `canav-${m[1]}-${m[2]}`, source: 'catholic-answers', type: 'navigator', title: `Bible Navigator: ${pretty(m[1])}`, url, refs: toAnchorIds(refs), how: 'url-slug', note: `Catholic Answers’ own Bible Navigator page on “${pretty(m[1])}” for this passage (topic and passage read from the page address).` });
      navOk++;
    }
  }

  // output per book
  const byBook = new Map<string, any[]>();
  for (const r of rows) {
    for (const ref of r.refs) {
      const m = /^([1-3A-Z]{3})\.(\d+)(?:\.(\d+))?(?:-(\d+)(?:\.(\d+))?)?$/.exec(ref);
      if (!m) continue;
      const c1 = +m[2];
      const v1 = m[3] ? +m[3] : 0;
      const c2 = m[5] ? +m[4] : m[4] && !m[3] ? +m[4] : c1;
      const v2 = m[5] ? +m[5] : m[4] && m[3] ? +m[4] : v1;
      (byBook.get(m[1]) ?? byBook.set(m[1], []).get(m[1])!).push([c1, v1, c2, v2, r.id]);
    }
  }
  const catalog: Record<string, Omit<ExternalRow, 'refs'>> = {};
  for (const r of rows) {
    const { refs: _r, ...rest } = r;
    catalog[r.id] = rest;
  }
  for (const [book, list] of byBook) writeJson(join(PUBLIC_DATA, 'resources', `${book}.json`), list);
  writeJson(join(PUBLIC_DATA, 'resources/catalog.json'), catalog);
  writeJson(
    join(PUBLIC_DATA, 'resources/_meta.json'),
    { generated: today(), count: rows.length, books: byBook.size, note: 'Links and metadata only. No publisher page content is stored.' },
    true,
  );
  report.stats['external'] = { rows: rows.length, caNavigator: navOk, caNavigatorSkippedAmbiguous: navSkipped, books: byBook.size };
  writeJson(
    join(PUBLIC_DATA, 'resources/sources.json'),
    registry.map((x) => ({ id: x.id, name: x.name, kind: x.kind, site: x.site, section: x.section, policy: x.policy?.summary, search: x.search, youtubeQuery: x.youtubeQuery, podcastQuery: x.podcastQuery })),
    true,
  );
  void BOOKS;
  void lookupBook;
}
