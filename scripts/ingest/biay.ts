import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS, getBook } from '../../src/lib/canon';
import { lookupBook, refId, type Ref } from '../../src/lib/refs';
import { chapterToAnchorRefs } from '../../src/lib/versification';
import { CURATED, PUBLIC_DATA, RAW, readJson, Report, today, writeJson, exists } from './lib/util';
import { decodeEntities } from './lib/thml';

/**
 * Bible in a Year (with Fr. Mike Schmitz) — episode ingestion from the official public podcast RSS feed.
 *
 * Only metadata is stored (title, date, duration, links, description). Scripture passages come from the
 * feed's own keywords/description, are voted across the five yearly re-releases of each "Day", and are
 * then overlaid with human-reviewed overrides from data/curated/biay-overrides.json.
 * The numbering of the plan is the modern (English/Hebrew) one, e.g. "Psalm 19"; it is converted to the anchor.
 */

const BOOK_WORDS = (() => {
  const names = new Set<string>();
  for (const b of BOOKS) {
    names.add(b.name);
    b.aliases.filter((a) => a.length > 3).forEach((a) => names.add(a));
  }
  ['Psalm', 'Psalms', 'Song of Solomon', 'Wisdom of Solomon', 'Ecclesiasticus', 'Sirach', 'Maccabees', 'Revelation'].forEach((n) => names.add(n));
  return [...names].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
})();
const PASSAGE_RE = new RegExp(`(?<![A-Za-z])((?:[1-3]\\s?)?(?:${BOOK_WORDS.join('|')}))\\.?\\s+(\\d{1,3})(?:\\s*[-–—]\\s*(\\d{1,3}))?(?![\\d:])`, 'gi');

interface RawPassage {
  book: string;
  c1: number;
  c2: number;
}

function passagesFrom(text: string): RawPassage[] {
  const out: RawPassage[] = [];
  for (const m of text.matchAll(PASSAGE_RE)) {
    const book = lookupBook(m[1].replace(/\s+/g, ' '));
    if (!book) continue;
    const c1 = +m[2];
    const c2 = m[3] ? +m[3] : c1;
    if (c1 < 1 || Math.max(c1, c2) > getBook(book).chapters) continue; // e.g. a typo such as "Psalm 199"; never guess
    out.push({ book, c1, c2: Math.max(c1, c2) });
  }
  return out;
}

const key = (p: RawPassage) => `${p.book}.${p.c1}-${p.c2}`;

function htmlToText(s: string) {
  return decodeEntities(s.replace(/<\/p>/g, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

export interface Episode {
  id: string;
  day: number | null;
  year: number | null;
  kind: 'day' | 'bonus';
  title: string;
  short: string;
  date: string;
  duration: number | null;
  audio: string;
  page: string;
  player?: string;
  description: string;
  /** anchor passage ids, chapter-level */
  passages: string[];
  passageSource: 'feed-keywords' | 'feed-description' | 'day-consensus' | 'curated' | 'none';
}

export function buildBiay(report: Report) {
  const path = join(RAW, 'biay.rss.xml');
  if (!exists(path)) return report.warn('biay: feed not fetched');
  const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', processEntities: true, textNodeName: '#text' }).parse(readFileSync(path, 'utf8'));
  const channel = xml.rss.channel;
  const items: any[] = Array.isArray(channel.item) ? channel.item : [channel.item];
  const raw: (Episode & { _own: RawPassage[]; _src: Episode['passageSource'] })[] = [];

  for (const it of items) {
    const title: string = String(it.title ?? '').trim();
    const m = /^Day\s+(\d+):\s*(.*?)(?:\s*\((\d{4})\))?$/.exec(title);
    const desc = htmlToText(String(it.description ?? ''));
    const keywords = String(it['itunes:keywords'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const fromKeywords: RawPassage[] = [];
    for (const k of keywords) fromKeywords.push(...passagesFrom(k).filter((p) => k.toLowerCase().replace(/[^a-z0-9]/g, '').length < 24));
    const fromDesc = passagesFrom(String(it['itunes:subtitle'] ?? '') + ' ' + desc.split('\n')[0]);
    const own = fromKeywords.length ? fromKeywords : fromDesc;
    const pub = new Date(it.pubDate);
    const dur = String(it['itunes:duration'] ?? '');
    const dparts = dur.split(':').map(Number);
    const seconds = dparts.length === 3 ? dparts[0] * 3600 + dparts[1] * 60 + dparts[2] : dparts.length === 2 ? dparts[0] * 60 + dparts[1] : null;
    raw.push({
      id: String(it.guid?.['#text'] ?? it.guid),
      day: m ? +m[1] : null,
      year: m && m[3] ? +m[3] : null,
      kind: m ? 'day' : 'bonus',
      title,
      short: m ? m[2] : title,
      date: isNaN(+pub) ? '' : pub.toISOString().slice(0, 10),
      duration: seconds,
      audio: it.enclosure?.['@url'] ?? '',
      page: String(it.link ?? ''),
      player: it['fireside:playerURL'] ?? it.playerURL,
      description: desc.slice(0, 700),
      passages: [],
      passageSource: own.length ? (fromKeywords.length ? 'feed-keywords' : 'feed-description') : 'none',
      _own: own,
      _src: own.length ? (fromKeywords.length ? 'feed-keywords' : 'feed-description') : 'none',
    });
  }

  // Consensus passages per Day across yearly releases.
  const byDay = new Map<number, typeof raw>();
  for (const e of raw) if (e.day) (byDay.get(e.day) ?? byDay.set(e.day, []).get(e.day)!).push(e);
  const consensus = new Map<number, RawPassage[]>();
  const disagreements: string[] = [];
  for (const [day, eps] of byDay) {
    const tally = new Map<string, { n: number; p: RawPassage; first: number }>();
    for (const e of eps) {
      const seen = new Set<string>();
      e._own.forEach((p, i) => {
        const k = key(p);
        if (seen.has(k)) return;
        seen.add(k);
        const t = tally.get(k) ?? { n: 0, p, first: i };
        t.n++;
        tally.set(k, t);
      });
    }
    const need = Math.max(1, Math.ceil(eps.length / 2));
    const chosen = [...tally.values()].filter((t) => t.n >= need).sort((a, b) => a.first - b.first).map((t) => t.p);
    consensus.set(day, chosen);
    const distinct = new Set(eps.map((e) => e._own.map(key).sort().join('|')));
    if (distinct.size > 1) disagreements.push(`Day ${day}: ${distinct.size} variants across ${eps.length} releases → using ${chosen.map(key).join(', ')}`);
  }

  // Curated overrides (human-reviewed) — data/curated/biay-overrides.json
  const overridesPath = join(CURATED, 'biay-overrides.json');
  const overrides: { day?: number; id?: string; passages: string[]; reviewedBy: string; reviewedOn: string; note?: string }[] = exists(overridesPath) ? readJson(overridesPath).overrides : [];

  const toAnchor = (ps: RawPassage[]): string[] => {
    const out: string[] = [];
    for (const p of ps) {
      let bk;
      try {
        bk = getBook(p.book);
      } catch {
        continue;
      }
      void bk;
      for (let c = p.c1; c <= p.c2; c++) {
        for (const a of chapterToAnchorRefs('kjv', p.book, c)) {
          const id = refId(a.ref);
          if (!out.includes(id)) out.push(id);
        }
      }
    }
    return out;
  };

  let unresolved = 0;
  const episodes: Episode[] = raw.map((e) => {
    const { _own, _src, ...ep } = e;
    let ps: RawPassage[] = _own;
    let src: Episode['passageSource'] = _src;
    if (e.day && consensus.get(e.day)?.length) {
      ps = consensus.get(e.day)!;
      src = 'day-consensus';
    }
    ep.passages = toAnchor(ps);
    ep.passageSource = ps.length ? src : 'none';
    const ov = overrides.find((o) => (o.id && o.id === e.id) || (o.day && o.day === e.day && !o.id));
    if (ov) {
      ep.passages = ov.passages;
      ep.passageSource = 'curated';
    }
    if (e.kind === 'day' && !ep.passages.length) {
      unresolved++;
      report.warn(`biay: Day ${e.day} (${e.year}) has no resolvable passages`);
    }
    return ep as Episode;
  });

  // Day plan (the reading plan itself, independent of release order)
  const days: Record<string, { passages: string[]; title?: string }> = {};
  for (const [day, eps] of byDay) {
    const maxYear = Math.max(...eps.map((x) => x.year ?? 0));
    const sample = episodes.find((e) => e.day === day && e.year === maxYear) ?? episodes.find((e) => e.day === day)!;
    days[day] = { passages: sample.passages, title: sample.short };
  }
  const missingDays = Array.from({ length: 365 }, (_, i) => i + 1).filter((d) => !days[d] || !days[d].passages.length);

  writeJson(join(PUBLIC_DATA, 'media/biay.json'), {
    meta: {
      show: 'The Bible in a Year (with Fr. Mike Schmitz)',
      publisher: 'Ascension',
      feed: 'https://feeds.fireside.fm/bibleinayear/rss',
      home: 'https://www.ascensionpress.com/bibleinayear',
      page: 'https://bibleinayear.fireside.fm/',
      retrieved: today(),
      passageNumbering: 'Passages in the feed use modern chapter numbering and are converted to the Vulgate anchor by the app.',
      verification: 'Passages are taken from the feed\'s own keywords/description, majority-voted across yearly re-releases of each Day; entries with source "curated" were reviewed by a person (data/curated/biay-overrides.json).',
      rights: 'Metadata only. Audio and video belong to Ascension; the app links to the original and plays the publisher\'s own feed enclosure.',
    },
    days,
    episodes,
  });
  report.stats['biay'] = { episodes: episodes.length, dayEpisodes: episodes.filter((e) => e.kind === 'day').length, bonus: episodes.filter((e) => e.kind === 'bonus').length, unresolved, missingDays, dayVariantCount: disagreements.length };
  disagreements.slice(0, 40).forEach((d) => report.warn('biay: ' + d));
}
