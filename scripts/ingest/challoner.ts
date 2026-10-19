import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeEntities } from './lib/thml';
import { PUBLIC_DATA, RAW, Report, exists, today, writeJson } from './lib/util';
import { BOOK_BY_ID } from '../../src/lib/canon';

/** The Douay order used by the e-text: book NN → canon id. */
const DOUAY = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'TOB', 'JDT', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'WIS', 'SIR', 'ISA', 'JER', 'LAM', 'BAR', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', '1MA', '2MA', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'];

const clean = (h: string) => decodeEntities(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

export interface ChallonerBook {
  intro: string;
  chapters: Record<string, string>;
  notes: [number, number, number, number, string][];
}

/**
 * Challoner's annotations, book introductions and chapter summaries from the Project Gutenberg e-text of the Douay-Rheims
 * Bible (Challoner revision, 1749–1752). Verse numbering is Douay/Vulgate, which is the anchor numbering.
 * Only the editorial paragraphs are kept (the Bible text itself is already in the app from eBible.org).
 */
export function buildChalloner(report: Report) {
  const file = join(RAW, 'douay-rheims-gutenberg-8300.html');
  if (!exists(file)) return report.warn('challoner: not fetched');
  const html = readFileSync(file, 'utf8');
  const parts = html.split(/<a id="Book(\d\d)"><\/a>/);
  let notes = 0;
  let summaries = 0;
  let intros = 0;
  for (let i = 1; i < parts.length; i += 2) {
    const id = DOUAY[+parts[i] - 1];
    if (!id || !BOOK_BY_ID[id]) {
      report.warn(`challoner: unknown book number ${parts[i]}`);
      continue;
    }
    const paras = [...parts[i + 1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => clean(m[1])).filter(Boolean);
    const book: ChallonerBook = { intro: '', chapters: {}, notes: [] };
    let chapter = 0;
    let last: [number, number] | null = null;
    let sawVerse = false;
    const introParts: string[] = [];
    const summary: string[] = [];
    const flushSummary = () => {
      if (chapter && summary.length) book.chapters[chapter] = summary.join(' ');
      summary.length = 0;
    };
    for (const p of paras) {
      const ch = /^.{2,40} Chapter (\d+)$/.exec(p);
      const v = /^(\d+):(\d+)\.\s/.exec(p);
      if (ch) {
        flushSummary();
        chapter = +ch[1];
        sawVerse = false;
        last = null;
        continue;
      }
      if (v) {
        if (!sawVerse) flushSummary();
        sawVerse = true;
        last = [+v[1], +v[2]];
        continue;
      }
      if (!chapter) {
        if (!/^THE (BOOK|PSALMS|GOSPEL|ACTS|EPISTLE|APOCALYPSE|PROPHECY|LAMENTATIONS|CANTICLE|FIRST|SECOND|THIRD)/i.test(p) || p.length > 80) introParts.push(p);
        continue;
      }
      if (!sawVerse) summary.push(p);
      else if (last) {
        book.notes.push([last[0], last[1], last[0], last[1], p]);
        notes++;
      }
    }
    flushSummary();
    book.intro = introParts.join('\n\n');
    summaries += Object.keys(book.chapters).length;
    if (book.intro) intros++;
    writeJson(join(PUBLIC_DATA, 'commentary/challoner', `${id}.json`), book);
  }
  writeJson(
    join(PUBLIC_DATA, 'commentary/challoner/_meta.json'),
    {
      work: 'Douay-Rheims Bible (Challoner revision): annotations, book introductions and chapter summaries',
      author: 'Bishop Richard Challoner (1691–1781); earlier Douay-Rheims annotators',
      edition: 'Challoner revision, 1749–1752',
      etext: 'Project Gutenberg #8300',
      rights: 'public-domain',
      rightsEvidence: 'Eighteenth-century text. The Project Gutenberg e-text is a transcription; flagged for periodic review.',
      url: 'https://www.gutenberg.org/ebooks/8300',
      retrieved: today(),
      numbering: 'Vulgate/Douay (matches the anchor)',
      notes,
      chapterSummaries: summaries,
      bookIntroductions: intros,
    },
    true,
  );
  report.stats['challoner'] = { notes, chapterSummaries: summaries, bookIntroductions: intros };
}
