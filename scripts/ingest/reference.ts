import { unzipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lookupBook, refId, type Ref } from '../../src/lib/refs';
import { toAnchor } from '../../src/lib/versification';
import { OPENBIBLE_BOOKS } from './xrefs';
import { PUBLIC_DATA, RAW, Report, today, writeJson, exists } from './lib/util';

/**
 * OpenBible.info datasets (CC BY 4.0): Bible geocoding (places with coordinates) and the topical index.
 * Both use English (ESV/KJV-style) verse numbers, which we convert to the anchor numbering.
 */
const anchorRange = (book: string, c1: number, v1: number, c2: number, v2: number): Ref => {
  const a = toAnchor('kjv', book, c1, v1);
  const b = toAnchor('kjv', book, c2, v2);
  const sameCh = a.c === b.c;
  return { book, c1: a.c, v1: a.v1, c2: b.c, v2: sameCh ? Math.max(b.v2, a.v1) : b.v2 };
};

export function buildPlaces(report: Report) {
  const path = join(RAW, 'openbible-geo-merged.txt');
  if (!exists(path)) return report.warn('maps: openbible-geo-merged.txt not fetched');
  const num = (s: string) => {
    const t = s.trim();
    const approx = /^[~><]/.test(t);
    const n = parseFloat(t.replace(/^[~><]/, ''));
    return { n: Number.isFinite(n) ? n : null, approx };
  };
  const places: any[] = [];
  const byBook = new Map<string, any[]>();
  let skipped = 0;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [name, root, lat, lon, verses, comment] = line.split('\t');
    const la = num(lat ?? '');
    const lo = num(lon ?? '');
    if (la.n === null || lo.n === null) {
      skipped++;
      continue;
    }
    const idx = places.length;
    const refs: string[] = [];
    for (const v of (verses ?? '').split(/,\s*/)) {
      const m = /^((?:[1-3]\s)?[A-Za-z]+)\.?\s+(\d+):(\d+)/.exec(v.trim());
      if (!m) continue;
      const bookName = m[1].replace(/\s/g, '');
      const book = lookupBook(m[1]) ?? lookupBook(bookName);
      if (!book) continue;
      const a = anchorRange(book, +m[2], +m[3], +m[2], +m[3]);
      refs.push(refId(a));
      (byBook.get(book) ?? byBook.set(book, []).get(book)!).push([a.c1, a.v1, idx]);
    }
    if (!refs.length) {
      places.push(null);
      skipped++;
      continue;
    }
    places.push({ n: name, ...(root && root !== name ? { r: root } : {}), lat: +la.n.toFixed(4), lon: +lo.n.toFixed(4), ...(la.approx || lo.approx ? { a: 1 } : {}), ...(comment ? { c: comment.trim() } : {}), v: refs.slice(0, 12), nv: refs.length });
  }
  writeJson(join(PUBLIC_DATA, 'maps/places.json'), places);
  for (const [b, list] of byBook) writeJson(join(PUBLIC_DATA, 'maps/by-book', `${b}.json`), list);
  writeJson(join(PUBLIC_DATA, 'maps/_meta.json'), { generated: today(), places: places.filter(Boolean).length, attribution: 'Bible geocoding data © OpenBible.info, CC BY 4.0 (some data from OpenStreetMap contributors, ODbL). Locations are scholarly best guesses; "approximate" marks lower confidence.' }, true);
  report.stats['maps'] = { places: places.filter(Boolean).length, skippedNoCoordinates: skipped, books: byBook.size };
}

export function buildTopics(report: Report) {
  const path = join(RAW, 'openbible-topic-scores.zip');
  if (!exists(path)) return report.warn('topics: openbible-topic-scores.zip not fetched');
  const zip = unzipSync(new Uint8Array(readFileSync(path)));
  const name = Object.keys(zip).find((k) => k.endsWith('.txt'))!;
  const lines = new TextDecoder().decode(zip[name]).split('\n').slice(1);
  const MIN = 3;
  const topics = new Map<string, [string, number][]>();
  const parse = (s: string) => {
    const m = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/.exec(s);
    return m && OPENBIBLE_BOOKS[m[1]] ? { book: OPENBIBLE_BOOKS[m[1]], c: +m[2], v: +m[3] } : null;
  };
  for (const line of lines) {
    const [topic, osis, scoreS] = line.split('\t');
    const score = parseInt(scoreS, 10);
    if (!topic || !(score >= MIN)) continue;
    const [a, b] = osis.split('-');
    const p1 = parse(a);
    const p2 = b ? parse(b) : p1;
    if (!p1 || !p2) continue;
    const r = anchorRange(p1.book, p1.c, p1.v, p2.c, p2.v);
    if (r.c2 < r.c1 || (r.c2 === r.c1 && (r.v2 ?? 0) < (r.v1 ?? 0))) continue;
    (topics.get(topic) ?? topics.set(topic, []).get(topic)!).push([refId(r), score]);
  }
  const names = [...topics.keys()].sort((x, y) => x.localeCompare(y));
  const idx = new Map(names.map((n, i) => [n, i]));
  writeJson(join(PUBLIC_DATA, 'topics/index.json'), names.map((n) => [n, topics.get(n)!.length]));
  const byBook = new Map<string, any[]>();
  const perTopic: Record<string, [string, number][]> = {};
  for (const n of names) {
    const list = topics.get(n)!.sort((x, y) => y[1] - x[1]).slice(0, 60);
    perTopic[n] = list;
    for (const [id, score] of list) {
      const m = /^([1-3A-Z]{3})\.(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?$/.exec(id);
      if (!m) continue;
      (byBook.get(m[1]) ?? byBook.set(m[1], []).get(m[1])!).push([+m[2], +m[3], m[4] ? +m[4] : +m[2], m[5] ? +m[5] : +m[3], idx.get(n)!, score]);
    }
  }
  writeJson(join(PUBLIC_DATA, 'topics/topics.json'), perTopic);
  for (const [b, list] of byBook) writeJson(join(PUBLIC_DATA, 'topics/by-book', `${b}.json`), list);
  writeJson(join(PUBLIC_DATA, 'topics/_meta.json'), { generated: today(), topics: names.length, minScore: MIN, attribution: 'Topical index © OpenBible.info, CC BY 4.0. Passages are scored by community votes; a high score means many voters agreed, not that the Church endorses the match.' }, true);
  report.stats['topics'] = { topics: names.length, rowsKept: [...topics.values()].reduce((n, l) => n + l.length, 0) };
}
